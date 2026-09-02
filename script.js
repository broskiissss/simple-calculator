const display = document.getElementById('display');

// Append value to display
function appendToDisplay(value) {
    display.value += value;
}

// Clear the display
function clearDisplay() {
    display.value = '';
}

// Delete last character
function deleteLast() {
    display.value = display.value.slice(0, -1);
}

// Calculate the result
function calculate() {
    try {
        // Replace display symbols with JavaScript operators
        let expression = display.value.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Evaluate and display result
        display.value = eval(expression);
    } catch (error) {
        display.value = 'Error';
    }
}

// Allow keyboard input
document.addEventListener('keydown', function(e) {
    if (e.key >= '0' && e.key <= '9') appendToDisplay(e.key);
    if (e.key === '+') appendToDisplay('+');
    if (e.key === '-') appendToDisplay('-');
    if (e.key === '*') appendToDisplay('*');
    if (e.key === '/') {
        e.preventDefault();
        appendToDisplay('/');
    }
    if (e.key === '.') appendToDisplay('.');
    if (e.key === 'Enter') {
        e.preventDefault();
        calculate();
    }
    if (e.key === 'Backspace') deleteLast();
    if (e.key === 'Escape') clearDisplay();
});