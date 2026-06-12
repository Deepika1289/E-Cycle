import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Camera, Upload, AlertCircle, Play } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { qrAPI, rideAPI } from '../services/api';
import toast from 'react-hot-toast';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdFromHistory = searchParams.get('bookingId');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If redirected from History with a bookingId, offer to start directly
  const handleDirectStart = async () => {
    if (!bookingIdFromHistory) return;
    try {
      setIsProcessing(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const rideResponse = await rideAPI.start({
                bookingId: bookingIdFromHistory,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
              toast.success('Ride started successfully!');
              navigate(`/user/ride/${rideResponse.data.ride._id}`);
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to start ride');
            } finally {
              setIsProcessing(false);
            }
          },
          () => {
            // Location denied — use default coordinates
            rideAPI.start({
              bookingId: bookingIdFromHistory,
              latitude: 20.2961,
              longitude: 85.8245
            }).then(res => {
              toast.success('Ride started!');
              navigate(`/user/ride/${res.data.ride._id}`);
            }).catch((err: any) => {
              toast.error(err.response?.data?.message || 'Failed to start ride');
            }).finally(() => setIsProcessing(false));
          }
        );
      }
    } catch {
      setIsProcessing(false);
      toast.error('Failed to start ride');
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    
    // Initialize QR code scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      false
    );

    scanner.render(
      async (qrCodeMessage) => {
        // Success callback
        setScannedCode(qrCodeMessage);
        await handleQRCodeScanned(qrCodeMessage);
        scanner.clear();
        setIsScanning(false);
      },
      (errorMessage) => {
        // Error callback - don't show errors for scanning attempts
        if (!errorMessage.includes('No QR code found')) {
          console.warn('QR Scanner error:', errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
  };

  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    try {
      setIsProcessing(true);
      
      // Verify QR code with backend
      const response = await qrAPI.unlock(qrCode);
      
      if (response.data.unlockToken) {
        toast.success('QR code verified! Starting your ride...');
        
        // Get user location for ride start
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Start the ride
                const rideResponse = await rideAPI.start({
                  bookingId: response.data.booking.id,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });

                toast.success('Ride started successfully!');
                navigate(`/user/ride/${rideResponse.data.ride._id}`);
              } catch (error: any) {
                console.error('Error starting ride:', error);
                // Check if it's an authentication error
                if (error.response?.status === 401) {
                  toast.error('Authentication expired. Please log in again.');
                } else {
                  toast.error(error.response?.data?.message || 'Failed to start ride');
                }
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              toast.error('Location access required to start ride');
            }
          );
        } else {
          toast.error('Geolocation not supported');
        }
      }
    } catch (error: any) {
      console.error('QR code verification error:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
      } else {
        toast.error(error.response?.data?.message || 'Invalid QR code');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For demo purposes, simulate QR code scanning from file
    const reader = new FileReader();
    reader.onload = () => {
      // In a real app, you'd use a library to decode QR from image
      // For demo, we'll use a sample QR code
      const sampleQRCode = `CYCLE_CYC001_${Date.now()}_demo`;
      handleQRCodeScanned(sampleQRCode);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <QrCode className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white-900 mb-2">Scan QR Code</h1>
          <p className="text-gray-600">
          Scan the QR code on your booked cycle to unlock and start your ride
        </p>
      </div>

      <div className="space-y-6">
        {/* Direct Start from History */}
        {bookingIdFromHistory && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center">
            <Play className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Ride!</h3>
            <p className="text-green-700 mb-4">Your booking is confirmed. Start your ride now.</p>
            <button
              onClick={handleDirectStart}
              disabled={isProcessing}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Starting...' : 'Start Ride Now'}
            </button>
          </div>
        )}

        {/* Scanner Container */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {!isScanning && (
            <div className="p-8 text-center">
              <div className="w-64 h-64 mx-auto mb-6 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">QR code scanner will appear here</p>
                </div>
              </div>
              
              <button
                onClick={handleStartScanning}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Scanning
              </button>
            </div>
          )}

          {isScanning && (
            <div className="p-4">
              <div id="qr-reader" className="w-full"></div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={handleStopScanning}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alternative Upload Option */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">
            Alternative: Upload QR Image
          </h3>
          <p className="text-gray-600 mb-4">
            If camera scanning isn't working, you can upload a photo of the QR code
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>Choose Image</span>
          </button>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">Processing QR code...</span>
            </div>
          </div>
        )}

        {/* Scanned Code Display */}
        {scannedCode && !isProcessing && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">Scanned QR Code:</h4>
            <p className="text-green-800 font-mono text-sm break-all">{scannedCode}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">Instructions</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <p className="text-gray-700">
                Make sure you have a confirmed booking for the cycle you want to unlock
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <p className="text-gray-700">
                Point your camera at the QR code on the cycle's handlebar or seat
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <p className="text-gray-700">
                Hold steady until the code is scanned and verified
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                4
              </div>
              <p className="text-gray-700">
                Once unlocked, your ride will start automatically
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-2">Troubleshooting</h4>
              <ul className="text-orange-800 text-sm space-y-1">
                <li>• Make sure the QR code is well-lit and not damaged</li>
                <li>• Hold your device steady and at arm's length</li>
                <li>• Allow camera permissions when prompted</li>
                <li>• If scanning fails, try uploading a photo instead</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};