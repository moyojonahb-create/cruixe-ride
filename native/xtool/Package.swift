// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CruiXe",
    platforms: [.iOS(.v15)],
    products: [.library(name: "CruiXe", targets: ["CruiXe"])],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.0.2"),
        .package(path: "../../ios/App/CapApp-SPM")
    ],
    targets: [.target(
        name: "CruiXe",
        dependencies: [
            .product(name: "Capacitor", package: "capacitor-swift-pm"),
            .product(name: "CapApp-SPM", package: "CapApp-SPM")
        ],
        // Capacitor discovers Objective-C plugin classes at runtime.
        linkerSettings: [.unsafeFlags(["-Xlinker", "-ObjC"])]
    )]
)
