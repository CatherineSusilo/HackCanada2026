import Foundation
import Combine
import SmartSpectraSwiftSDK

class SmartSpectraManager: ObservableObject {
    @Published var isMonitoring = false
    @Published var currentMetrics: VitalsMetrics?
    
    private var cancellables = Set<AnyCancellable>()
    let metricsPublisher = PassthroughSubject<VitalsMetrics, Never>()
    
    private let sdk = SmartSpectraSwiftSDK.shared
    
    init() {
        setupObservers()
    }
    
    private func setupObservers() {
        // Observe pulse rate
        NotificationCenter.default.publisher(for: .pulseRateUpdated)
            .sink { [weak self] notification in
                self?.handlePulseUpdate(notification)
            }
            .store(in: &cancellables)
        
        // Observe breathing rate
        NotificationCenter.default.publisher(for: .breathingRateUpdated)
            .sink { [weak self] notification in
                self?.handleBreathingUpdate(notification)
            }
            .store(in: &cancellables)
        
        // Observe signal quality
        NotificationCenter.default.publisher(for: .signalQualityUpdated)
            .sink { [weak self] notification in
                self?.handleQualityUpdate(notification)
            }
            .store(in: &cancellables)
    }
    
    func startMonitoring() {
        isMonitoring = true
        sdk.startMeasurement()
    }
    
    func stopMonitoring() {
        isMonitoring = false
        sdk.stopMeasurement()
    }
    
    private func handlePulseUpdate(_ notification: Notification) {
        guard let pulseRate = notification.userInfo?["pulseRate"] as? Double else { return }
        
        var metrics = currentMetrics ?? VitalsMetrics()
        metrics.pulseRate = pulseRate
        metrics.timestamp = Date()
        currentMetrics = metrics
        metricsPublisher.send(metrics)
    }
    
    private func handleBreathingUpdate(_ notification: Notification) {
        guard let breathingRate = notification.userInfo?["breathingRate"] as? Double else { return }
        
        var metrics = currentMetrics ?? VitalsMetrics()
        metrics.breathingRate = breathingRate
        metrics.timestamp = Date()
        currentMetrics = metrics
        metricsPublisher.send(metrics)
    }
    
    private func handleQualityUpdate(_ notification: Notification) {
        guard let quality = notification.userInfo?["quality"] as? Double else { return }
        
        var metrics = currentMetrics ?? VitalsMetrics()
        metrics.signalQuality = quality
        metrics.timestamp = Date()
        currentMetrics = metrics
        metricsPublisher.send(metrics)
    }
}

struct VitalsMetrics: Codable {
    var pulseRate: Double?
    var breathingRate: Double?
    var signalQuality: Double?
    var timestamp: Date = Date()
    
    var isAsleep: Bool {
        // Child sleep indicators:
        // - Pulse rate typically drops 10-30% during sleep (60-100 awake -> 50-70 asleep for children)
        // - Breathing rate slows (12-20 awake -> 10-15 asleep)
        // - Stable, regular patterns
        
        guard let pulse = pulseRate, let breathing = breathingRate else {
            return false
        }
        
        let isPulseInSleepRange = pulse < 75
        let isBreathingInSleepRange = breathing < 16
        let hasGoodQuality = (signalQuality ?? 0) > 0.7
        
        return isPulseInSleepRange && isBreathingInSleepRange && hasGoodQuality
    }
    
    var sleepiness: Double {
        // Calculate sleepiness score from 0 (awake) to 1 (asleep)
        guard let pulse = pulseRate, let breathing = breathingRate else {
            return 0.5
        }
        
        // Normalize pulse (100 awake -> 60 asleep)
        let pulseScore = max(0, min(1, (100 - pulse) / 40))
        
        // Normalize breathing (20 awake -> 12 asleep)
        let breathingScore = max(0, min(1, (20 - breathing) / 8))
        
        // Average the scores
        return (pulseScore + breathingScore) / 2
    }
}

// Notification names
extension Notification.Name {
    static let pulseRateUpdated = Notification.Name("pulseRateUpdated")
    static let breathingRateUpdated = Notification.Name("breathingRateUpdated")
    static let signalQualityUpdated = Notification.Name("signalQualityUpdated")
}
