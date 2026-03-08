import SwiftUI
import SmartSpectraSwiftSDK
import AVFoundation

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @StateObject private var spectraManager = SmartSpectraManager()
    @StateObject private var webViewStore = WebViewStore()
    @State private var cameraGranted = false

    init() {
        SmartSpectraSwiftSDK.shared.setApiKey("BGvdA0lLfe70oLSvugIs31tIzrGU6KqI8Q5wG5lj")
    }

    var body: some View {
        ZStack {
            if cameraGranted {
                // Web view displaying your React app
                WebView(webViewStore: webViewStore, spectraManager: spectraManager)
                    .edgesIgnoringSafeArea(.all)

                // SmartSpectra overlay for vitals monitoring
                VStack {
                    Spacer()
                    SmartSpectraView()
                        .frame(width: 160, height: 160)
                        .cornerRadius(12)
                        .padding(.bottom, 40)
                        .onReceive(spectraManager.metricsPublisher) { metrics in
                            webViewStore.sendMetrics(metrics)
                        }
                }
            } else {
                Color.black
                    .edgesIgnoringSafeArea(.all)
                    .onAppear {
                        AVCaptureDevice.requestAccess(for: .video) { granted in
                            DispatchQueue.main.async {
                                cameraGranted = granted
                                if granted {
                                    spectraManager.startMonitoring()
                                }
                                print("Camera granted: \(granted)")
                            }
                        }
                    }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .previewDevice("iPhone 15")
    }
}
