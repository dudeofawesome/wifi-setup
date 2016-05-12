var onload =  () => {

};

var submitForm = (name) => {
    if (checkInputForErrors(name)) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = () => {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                if (xmlhttp.responseText == 'success') {
                    document.getElementById('inside').innerHTML = '<div class="responseMessage"><i class"=mdi mdi-check"></i></div><input type="button" class="material light raised" value="Close" onclick="closeForm(\'register\', document.getElementById(\'registerButton\'));" />';
                }
            }
        };
        xmlhttp.open('POST', '/save-settings', true);
        xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        var name = document.getElementById('name');
        var addressLine1 = document.getElementById('address_line_1');
        var addressLine2 = document.getElementById('address_line_2');
        var wifiSSID = document.getElementById('WiFi_SSID');
        var wifiPassword = document.getElementById('WiFi_password');
        xmlhttp.send('name=' + name.value + '&addressLine1=' + addressLine1.value + '&addressLine2=' + addressLine2.value + '&wifiSSID=' + wifiSSID.value + '&wifiPassword=' + wifiPassword.value);
    }
};

var checkInputForErrors = (name) => {
    var hasError = false;

    var name = document.getElementById('name');
    var addressLine1 = document.getElementById('address_line_1');
    var addressLine2 = document.getElementById('address_line_2');
    var wifiSSID = document.getElementById('WiFi_SSID');
    var wifiPassword = document.getElementById('WiFi_password');

    if (name.value === '') {
        name.setAttribute('error', '');
        name.nextSibling.innerHTML = 'Can not be blank';
        name.focus();
        hasError = true;
    } else {
        name.removeAttribute('error');
        name.nextSibling.innerHTML = 'We\'re all good';
    }
    if (addressLine1.value === '') {
        addressLine1.setAttribute('error', '');
        addressLine1.nextSibling.innerHTML = 'Can not be blank';
        addressLine1.focus();
        hasError = true;
    } else {
        addressLine1.removeAttribute('error');
        addressLine1.nextSibling.innerHTML = 'We\'re all good';
    }
    if (addressLine2.value === '') {
        addressLine2.setAttribute('error', '');
        addressLine2.nextSibling.innerHTML = 'Can not be blank';
        addressLine2.focus();
        hasError = true;
    } else {
        addressLine2.removeAttribute('error');
        addressLine2.nextSibling.innerHTML = 'We\'re all good';
    }
    if (wifiSSID.value === '') {
        wifiSSID.setAttribute('error', '');
        wifiSSID.nextSibling.innerHTML = 'Can not be blank';
        wifiSSID.focus();
        hasError = true;
    } else {
        wifiSSID.removeAttribute('error');
        wifiSSID.nextSibling.innerHTML = 'We\'re all good';
    }
    if (wifiPassword.value === '') {
        wifiPassword.setAttribute('error', '');
        wifiPassword.nextSibling.innerHTML = 'Can not be blank';
        wifiPassword.focus();
        hasError = true;
    } else if (wifiPassword.value.length < 7) {
        wifiPassword.setAttribute('error', '');
        wifiPassword.nextSibling.innerHTML = 'Incorrect password';
        wifiPassword.focus();
        hasError = true;
    } else {
        wifiPassword.removeAttribute('error');
        wifiPassword.nextSibling.innerHTML = 'We\'re all good';
    }

    return !hasError;
};

var isEmail = (email) => {
    return (
        email.length >= 5 &&
        email.indexOf(' ') == -1 &&
        email.split('@').length == 2 &&
        email.split('.').length == 2 &&
        email.indexOf('@') < email.indexOf('.') - 1 &&
        email.indexOf('@') != 0 &&
        email.indexOf('.') != email.length - 1
    );
};
