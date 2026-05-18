#!/usr/bin/env bash
# Build a release tarball for the given version tag.
# Usage: bash scripts/build-release.sh v1.0.0
set -euo pipefail

TAG="${1:?Usage: build-release.sh <tag>}"
BUILD_DIR="dist/release/${TAG}"

echo "Building release tarball for ${TAG}..."

mkdir -p "${BUILD_DIR}"

# Copy built artefacts and runtime files
cp -r server/dist "${BUILD_DIR}/server"
cp -r client/dist "${BUILD_DIR}/client"
cp -r install "${BUILD_DIR}/install"
cp -r plugins "${BUILD_DIR}/plugins"
cp package.json package-lock.json "${BUILD_DIR}/"
cp CHANGELOG.md README.md LICENSE "${BUILD_DIR}/" 2>/dev/null || true

# Strip dev-only files from plugins
find "${BUILD_DIR}/plugins" -name "*.test.*" -delete 2>/dev/null || true
find "${BUILD_DIR}/plugins" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Create tarball (relative to dist/release so the top-level dir inside is the tag)
tar -czf "nestor-${TAG}.tar.gz" -C "dist/release" "${TAG}"

# Generate checksum
sha256sum "nestor-${TAG}.tar.gz" > "nestor-${TAG}.tar.gz.sha256"

echo "Created: nestor-${TAG}.tar.gz"
echo "SHA256:  $(cat "nestor-${TAG}.tar.gz.sha256")"
