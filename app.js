let inventory = [];
let html5QrScanner;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    document.getElementById('toggle-scanner').addEventListener('click', toggleScanner);
    document.getElementById('barcode-image').addEventListener('change', handleBarcodeImage);
    updateInventoryDisplay();
});


function startScanner() {
    const qrConfig = { fps: 10, qrbox: { width: 250, height: 150 } };
    html5QrScanner = new Html5Qrcode("qr-scanner");
    
    html5QrScanner.start(
        { facingMode: "environment" }, 
        qrConfig,
        onScanSuccess,
        onScanFailure
    )
    .then(() => {
        document.getElementById('toggle-scanner').innerHTML = '<i class="fas fa-stop"></i> Stop Scanner';
    })
    .catch(err => {
        console.error('Error starting scanner:', err);
        alert('Could not start camera. Please check camera permissions.');
    });
}

function stopScanner() {
    if (html5QrScanner && html5QrScanner.isScanning) {
        html5QrScanner.stop()
        .then(() => {
            document.getElementById('toggle-scanner').innerHTML = '<i class="fas fa-camera"></i> Start Scanner';
        })
        .catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function toggleScanner() {
    if (!html5QrScanner || !html5QrScanner.isScanning) {
        startScanner();
    } else {
        stopScanner();
    }
}

function onScanSuccess(decodedText) {
   
    console.log(`Barcode detected: ${decodedText}`);
    

    processBarcode(decodedText);
    
    
    stopScanner();
}

function onScanFailure(error) {
    
}

function handleBarcodeImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    
    if (!html5QrScanner) {
        html5QrScanner = new Html5Qrcode("qr-scanner");
    }
    
    html5QrScanner.scanFile(file, true)
        .then(decodedText => {
            processBarcode(decodedText);
        })
        .catch(err => {
            console.error('Error scanning file:', err);
            alert('Could not detect any barcode in the image.');
        });
}

function processBarcode(barcodeData) {

    
    try {
       
        const productDatabase = {
            '5901234123457': {name: 'Milk', quantity: 1, expiry: getDefaultExpiryDate(7)},
            '4005808235131': {name: 'Bread', quantity: 1, expiry: getDefaultExpiryDate(3)},
            '8001505005592': {name: 'Eggs', quantity: 12, expiry: getDefaultExpiryDate(14)},
            '3045320094084': {name: 'Cheese', quantity: 1, expiry: getDefaultExpiryDate(21)},
            '5449000131836': {name: 'Coca-Cola', quantity: 1, expiry: getDefaultExpiryDate(90)}
        };
        
        if (productDatabase[barcodeData]) {
            const product = productDatabase[barcodeData];
            
            
            document.getElementById('itemName').value = product.name;
            document.getElementById('itemQty').value = product.quantity;
            document.getElementById('expiryDate').value = product.expiry;
            
           
        } else {
         
            document.getElementById('itemName').value = `Item: ${barcodeData}`;
            document.getElementById('itemQty').value = 1;
            document.getElementById('expiryDate').value = getDefaultExpiryDate(30);
        }
    } catch (error) {
        console.error('Error processing barcode:', error);
        alert('Error processing barcode data. Please try again.');
    }
}

function getDefaultExpiryDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0]; 
}

function addItem() {
    const itemName = document.getElementById('itemName').value;
    const itemQty = document.getElementById('itemQty').value;
    const expiryDate = document.getElementById('expiryDate').value;

    if (!itemName || !itemQty || !expiryDate) {
        alert('Please fill all fields');
        return;
    }

    const newItem = {
        name: itemName,
        quantity: parseInt(itemQty),
        expiry: expiryDate,
        status: getStatus(expiryDate)
    };

    inventory.push(newItem);
    updateInventoryDisplay();
    clearForm();
    updateAlerts();
}

function getStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return 'expired';
    if (daysDiff <= 3) return 'expiring';
    return 'fresh';
}

function updateInventoryDisplay() {
    const inventoryGrid = document.getElementById('inventoryGrid');
    inventoryGrid.innerHTML = inventory.map((item, index) => `
        <div class="item-card">
            <div class="status-indicator ${item.status}"></div>
            <h3>${item.name}</h3>
            <p class="quantity">Quantity: ${item.quantity}</p>
            <p class="expiry">Expires: ${formatDate(item.expiry)}</p>
            <div class="actions">
                <button onclick="useItem(${index})"><i class="fas fa-utensils"></i> Use</button>
                <button onclick="deleteItem(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function useItem(index) {
    if (inventory[index].quantity > 0) {
        inventory[index].quantity--;
        inventory[index].status = getStatus(inventory[index].expiry);
        updateInventoryDisplay();
        updateAlerts();
    }
}

function deleteItem(index) {
    inventory.splice(index, 1);
    updateInventoryDisplay();
    updateAlerts();
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('expiryDate').value = '';
}

function updateAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    const expiringItems = inventory.filter(item => item.status === 'expiring');
    const lowStockItems = inventory.filter(item => item.quantity < 2);

    alertsContainer.innerHTML = `
        ${expiringItems.length > 0 ? `
            <div class="alert-banner alert-expiring">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${expiringItems.length} item${expiringItems.length !== 1 ? 's' : ''} approaching expiry date</span>
            </div>
        ` : ''}
        
        ${lowStockItems.length > 0 ? `
            <div class="alert-banner alert-low">
                <i class="fas fa-shopping-cart"></i>
                <span>${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} need${lowStockItems.length === 1 ? 's' : ''} restocking</span>
            </div>
        ` : ''}
    `;
}