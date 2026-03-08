import Foundation
import Combine
import SmartSpectraSwiftSDK

class SmartSpectraManager: ObservableObject {
    @Published var isMonitoring = false
    @Published var currentMetrics: VitalsMetrics?

    private var cancellables = Set<AnyCancellable>()
    let metricsPublisher = PassthroughSubject<VitalsMetrics, Never>()

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
        }
    }

    func stopMonitoring() {
        DispatchQueue.main.async {
            self.isMonitoring = false
        }
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
