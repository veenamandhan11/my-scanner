// Global variables
let uploadedImage = null;
let uploadedVideo = null;
let markerPattern = null;

// DOM elements
const imageUpload = document.getElementById('imageUpload');
const videoUpload = document.getElementById('videoUpload');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const generateBtn = document.getElementById('generateBtn');
const output = document.getElementById('output');
const scannerModal = document.getElementById('scannerModal');

// Event listeners
imageUpload.addEventListener('change', handleImageUpload);
videoUpload.addEventListener('change', handleVideoUpload);
generateBtn.addEventListener('click', generateARExperience);
document.getElementById('downloadMarker').addEventListener('click', downloadMarker);
document.getElementById('openScanner').addEventListener('click', openScanner);

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadedImage = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
        };
        reader.readAsDataURL(file);
        
        checkIfReady();
    }
}

// Handle video upload
function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
        uploadedVideo = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            videoPreview.innerHTML = `<video src="${e.target.result}" controls></video>`;
        };
        reader.readAsDataURL(file);
        
        checkIfReady();
    }
}

// Check if both files are uploaded
function checkIfReady() {
    if (uploadedImage && uploadedVideo) {
        generateBtn.disabled = false;
    }
}

// Generate AR experience
async function generateARExperience() {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    generateBtn.classList.add('loading');
    
    try {
        // Generate marker pattern from image
        await generateMarkerPattern();
        
        // Prepare video for AR
        await prepareVideo();
        
        // Show output section
        output.classList.remove('hidden');
        
        // Generate QR code for scanner URL
        generateQRCode();
        
        // Scroll to output
        output.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error generating AR experience:', error);
        alert('Error generating AR experience. Please try again.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate AR Experience';
        generateBtn.classList.remove('loading');
    }
}

// Generate marker pattern from uploaded image
async function generateMarkerPattern() {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Create canvas for marker generation
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size (AR.js works best with square markers)
                const size = 512;
                canvas.width = size;
                canvas.height = size;
                
                // Draw image centered and scaled
                const scale = Math.min(size / img.width, size / img.height);
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (size - width) / 2;
                const y = (size - height) / 2;
                
                // White background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, size, size);
                
                // Draw image
                ctx.drawImage(img, x, y, width, height);
                
                // Add border for better detection
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 20;
                ctx.strokeRect(10, 10, size - 20, size - 20);
                
                // Convert to data URL
                markerPattern = canvas.toDataURL('image/png');
                
                // Display marker
                document.getElementById('markerImage').src = markerPattern;
                
                resolve();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(uploadedImage);
    });
}

// Prepare video for AR playback
async function prepareVideo() {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store video data URL for AR scene
            const videoElement = document.getElementById('arVideo');
            videoElement.src = e.target.result;
            resolve();
        };
        reader.readAsDataURL(uploadedVideo);
    });
}

// Generate QR code for scanner URL
function generateQRCode() {
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = ''; // Clear existing QR code
    
    // In a real implementation, this would be your hosted URL
    const scannerURL = window.location.href + '#scanner';
    
    new QRCode(qrContainer, {
        text: scannerURL,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Download marker image
function downloadMarker() {
    const link = document.createElement('a');
    link.download = 'ar-marker.png';
    link.href = markerPattern;
    link.click();
}

// Open AR scanner
function openScanner() {
    scannerModal.classList.remove('hidden');
    
    // Initialize AR scene with custom marker
    const marker = document.getElementById('marker');
    
    // Create pattern file (in a real implementation, this would be uploaded to a server)
    // For demo purposes, we'll use a preset pattern
    marker.setAttribute('preset', 'hiro'); // Using Hiro marker as fallback
    
    // Start AR scene
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.components.arjs.sourceType = 'webcam';
    }
}

// Close scanner
function closeScanner() {
    scannerModal.classList.add('hidden');
    
    // Stop camera
    const video = document.querySelector('video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

// Handle escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !scannerModal.classList.contains('hidden')) {
        closeScanner();
    }
});

// Check for hash change (for QR code scanning)
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#scanner') {
        openScanner();
    }
});

// Check initial hash
if (window.location.hash === '#scanner') {
    openScanner();
}