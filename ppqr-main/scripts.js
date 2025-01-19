document.getElementById('submit-btn').addEventListener('click', function () {
    const utr = document.getElementById('utr').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value || 'Not Provided';
    const amount = document.getElementById('amount').value;
  
    if (utr === '' || email === '') {
      alert('Please fill in the required fields.');
    } else {
      // Specific message to be sent to WhatsApp
      const specificMessage = 'Payment Done';
  
      // Redirect to WhatsApp with a specific word
      window.location.href = `https://wa.me/1234567890?text=${encodeURIComponent(specificMessage)}`; // Replace 1234567890 with your WhatsApp number
    }
  });
  