import SwiftUI
import SmartSpectraSwiftSDK
import AVFoundation

struct ContentView: View {
    @StateObject private var spectraManager = SmartSpectraManager()
    @State private var cameraGranted = false

    init() {
        SmartSpectraSwiftSDK.shared.setApiKey("BGvdA0lLfe70oLSvugIs31tIzrGU6KqI8Q5wG5lj")
    }

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            // Camera runs invisibly — opacity 0, no visible UI
            SmartSpectraView()
                .edgesIgnoringSafeArea(.all)
                .opacity(0)
        }
        .onAppear {
            requestCameraAccess()
        }
        .preferredColorScheme(.dark)
    }

    private func requestCameraAccess() {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            DispatchQueue.main.async {
                self.cameraGranted = true
                self.spectraManager.startMonitoring()
            }
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    if granted {
                        self.cameraGranted = true
                        self.spectraManager.startMonitoring()
                    }
                }
            }
        case .denied, .restricted:
            break
        @unknown default:
            break
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .previewDevice("iPhone 15")
    }
}
