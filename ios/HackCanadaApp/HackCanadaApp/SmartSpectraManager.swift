import Foundation
import Combine
import SmartSpectraSwiftSDK

class SmartSpectraManager: ObservableObject {
    @Published var isMonitoring = false
    @Published var currentMetrics: VitalsMetrics?

    private var cancellables = Set<AnyCancellable>()
    let metricsPublisher = PassthroughSubject<VitalsMetrics, Never>()
    private var postTimer: Timer?

    // Change to your Mac's local IP for device testing
    #if DEBUG
    private let backendURL = "http://10.200.9.45:3001"
    #else
    private let backendURL = "http://localhost:3001"
    #endif

    init() {
        setupObservers()
    }

    private func setupObservers() {
        NotificationCenter.default.publisher(for: .pulseRateUpdated)
            .sink { [weak self] notification in
                self?.handlePulseUpdate(notification)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .breathingRateUpdated)
            .sink { [weak self] notification in
                self?.handleBreathingUpdate(notification)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .signalQualityUpdated)
            .sink { [weak self] notification in
                self?.handleQualityUpdate(notification)
            }
            .store(in: &cancellables)
    }

    func startMonitoring() {
        DispatchQueue.main.async {
            self.isMonitoring = true
            self.postTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
                self?.postCurrentVitals()
            }
        }
    }

    func stopMonitoring() {
        DispatchQueue.main.async {
            self.isMonitoring = false
            self.postTimer?.invalidate()
            self.postTimer = nil
        }
    }

    private func postCurrentVitals() {
        guard let metrics = currentMetrics,
              metrics.pulseRate != nil || metrics.breathingRate != nil else { return }

        guard let url = URL(string: "\(backendURL)/api/vitals/record") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var payload: [String: Any] = [
            "timestamp": ISO8601DateFormatter().string(from: metrics.timestamp)
        ]
        if let pulse = metrics.pulseRate { payload["pulseRate"] = pulse }
        if let breathing = metrics.breathingRate { payload["breathingRate"] = breathing }
        if let quality = metrics.signalQuality { payload["signalQuality"] = quality }

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload) else { return }
        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("Failed to post vitals: \(error)")
            }
        }.resume()
    }

    private func handlePulseUpdate(_ notification: Notification) {
        guard let pulseRate = notification.userInfo?["pulseRate"] as? Double else { return }
        DispatchQueue.main.async {
            var metrics = self.currentMetrics ?? VitalsMetrics()
            metrics.pulseRate = pulseRate
            metrics.timestamp = Date()
            self.currentMetrics = metrics
            self.metricsPublisher.send(metrics)
        }
    }

    private func handleBreathingUpdate(_ notification: Notification) {
        guard let breathingRate = notification.userInfo?["breathingRate"] as? Double else { return }
        DispatchQueue.main.async {
            var metrics = self.currentMetrics ?? VitalsMetrics()
            metrics.breathingRate = breathingRate
            metrics.timestamp = Date()
            self.currentMetrics = metrics
            self.metricsPublisher.send(metrics)
        }
    }

    private func handleQualityUpdate(_ notification: Notification) {
        guard let quality = notification.userInfo?["quality"] as? Double else { return }
        DispatchQueue.main.async {
            var metrics = self.currentMetrics ?? VitalsMetrics()
            metrics.signalQuality = quality
            metrics.timestamp = Date()
            self.currentMetrics = metrics
            self.metricsPublisher.send(metrics)
        }
    }
}

struct VitalsMetrics: Codable {
    var pulseRate: Double?
    var breathingRate: Double?
    var signalQuality: Double?
    var timestamp: Date = Date()

    var isAsleep: Bool {
        guard let pulse = pulseRate, let breathing = breathingRate else {
            return false
        }
        let isPulseInSleepRange = pulse < 75
        let isBreathingInSleepRange = breathing < 16
        let hasGoodQuality = (signalQuality ?? 0) > 0.7
        return isPulseInSleepRange && isBreathingInSleepRange && hasGoodQuality
    }

    var sleepiness: Double {
        guard let pulse = pulseRate, let breathing = breathingRate else {
            return 0.5
        }
        let pulseScore = max(0, min(1, (100 - pulse) / 40))
        let breathingScore = max(0, min(1, (20 - breathing) / 8))
        return (pulseScore + breathingScore) / 2
    }
}

extension Notification.Name {
    static let pulseRateUpdated = Notification.Name("pulseRateUpdated")
    static let breathingRateUpdated = Notification.Name("breathingRateUpdated")
    static let signalQualityUpdated = Notification.Name("signalQualityUpdated")
}
