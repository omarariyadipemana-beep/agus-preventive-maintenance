#!/bin/bash
# ==============================================================
# SCRIPT UPDATE OTOMATIS PREVENTIVE MAINTENANCE SYSTEM
# ==============================================================
set -e

echo "🚀 [1/3] Menarik update terbaru dari GitHub..."
git pull origin main

echo "🔨 [2/3] Menerapkan perubahan dan rebuild container..."
docker compose up -d --build

echo "✅ [3/3] Memeriksa status kesehatan aplikasi..."
sleep 5
docker compose ps

echo "========================================================"
echo "🎉 Update selesai! Aplikasi Anda telah berjalan versi terbaru."
echo "========================================================"
