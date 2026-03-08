import SwiftUI
import SmartSpectraSwiftSDK
import AVFoundation

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @StateObject private var spectraManager = SmartSpectraManager()
    @State private var cameraGranted = false
    @State private var cameraStatus: String = "Requesting camera..."

    init() {
        SmartSpectraSwiftSDK.shared.setApiKey("-")
    }

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            if cameraGranted {
                SmartSpectraView()
                    .edgesIgnoringSafeArea(.all)
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    Text(cameraStatus)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            }
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
                    } else {
                        self.cameraStatus = "Camera access denied. Please enable in Settings."
                    }
                }
            }
        case .denied, .restricted:
            DispatchQueue.main.async {
                self.cameraStatus = "Camera access denied. Please enable in Settings → Privacy → Camera."
            }
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
