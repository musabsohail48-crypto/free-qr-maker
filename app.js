// QR Code ki basic setting (Blue color aur center icon)
const qrCode = new QRCodeStyling({
    width: 250,
    height: 250,
    type: "svg",
    data: "https://yourwebsite.com", // Default link
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Link_icon_%28closed%29_-_blue.svg", // Center Icon (Chain link)
    dotsOptions: {
        color: "#2563eb", // Blue color
        type: "rounded"   // QR code ke dots ko pyara (round) banane ke liye
    },
    backgroundOptions: {
        color: "#ffffff", // White background
    },
    imageOptions: {
        crossOrigin: "anonymous",
        margin: 8
            }
});

// Page load hotay hi sample QR code right side wale box mein show ho jayega
window.onload = () => {
    // Ye code pichle step wale html box mein qr code daal dega
    const qrContainer = document.getElementById("qr-output");
    if(qrContainer) {
        qrContainer.innerHTML = ""; // Pehle se kuch hai toh clear karo
        qrCode.append(qrContainer);
    }
};
