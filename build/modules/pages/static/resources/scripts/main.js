var onload = function () {
};
var submitForm = function (name) {
    if (checkInputForErrors(name)) {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        }
        else {
            xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = function () {
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
var checkInputForErrors = function (name) {
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
    }
    else {
        name.removeAttribute('error');
        name.nextSibling.innerHTML = 'We\'re all good';
    }
    if (addressLine1.value === '') {
        addressLine1.setAttribute('error', '');
        addressLine1.nextSibling.innerHTML = 'Can not be blank';
        addressLine1.focus();
        hasError = true;
    }
    else {
        addressLine1.removeAttribute('error');
        addressLine1.nextSibling.innerHTML = 'We\'re all good';
    }
    if (addressLine2.value === '') {
        addressLine2.setAttribute('error', '');
        addressLine2.nextSibling.innerHTML = 'Can not be blank';
        addressLine2.focus();
        hasError = true;
    }
    else {
        addressLine2.removeAttribute('error');
        addressLine2.nextSibling.innerHTML = 'We\'re all good';
    }
    if (wifiSSID.value === '') {
        wifiSSID.setAttribute('error', '');
        wifiSSID.nextSibling.innerHTML = 'Can not be blank';
        wifiSSID.focus();
        hasError = true;
    }
    else {
        wifiSSID.removeAttribute('error');
        wifiSSID.nextSibling.innerHTML = 'We\'re all good';
    }
    if (wifiPassword.value === '') {
        wifiPassword.setAttribute('error', '');
        wifiPassword.nextSibling.innerHTML = 'Can not be blank';
        wifiPassword.focus();
        hasError = true;
    }
    else if (wifiPassword.value.length < 7) {
        wifiPassword.setAttribute('error', '');
        wifiPassword.nextSibling.innerHTML = 'Incorrect password';
        wifiPassword.focus();
        hasError = true;
    }
    else {
        wifiPassword.removeAttribute('error');
        wifiPassword.nextSibling.innerHTML = 'We\'re all good';
    }
    return !hasError;
};
var isEmail = function (email) {
    return (email.length >= 5 &&
        email.indexOf(' ') == -1 &&
        email.split('@').length == 2 &&
        email.split('.').length == 2 &&
        email.indexOf('@') < email.indexOf('.') - 1 &&
        email.indexOf('@') != 0 &&
        email.indexOf('.') != email.length - 1);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZXMvcGFnZXMvc3RhdGljL3Jlc291cmNlcy9zY3JpcHRzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLEdBQUk7QUFFZCxDQUFDLENBQUM7QUFFRixJQUFJLFVBQVUsR0FBRyxVQUFDLElBQUk7SUFDbEIsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksT0FBTyxDQUFDO1FBQ1osRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsT0FBTyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osT0FBTyxHQUFHLElBQUksYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDckQsQ0FBQztRQUNELE9BQU8sQ0FBQyxrQkFBa0IsR0FBRztZQUN6QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDcEMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEdBQUcscU5BQXFOLENBQUM7Z0JBQ3hRLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO1FBRTlFLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFD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QyxTQUFTLEdBQUcsaUJBQWlCLENBQUM7SUFDM0QsQ0FBQztJQUVELE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRixJQUFJLE9BQU8sR0FBRyxVQUFDLEtBQUs7SUFDaEIsTUFBTSxDQUFDLENBQ0gsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO1FBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUM7UUFDNUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQztRQUM1QixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUMzQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDdkIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FDekMsQ0FBQztBQUNOLENBQUMsQ0FBQyIsImZpbGUiOiJtb2R1bGVzL3BhZ2VzL3N0YXRpYy9yZXNvdXJjZXMvc2NyaXB0cy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIG9ubG9hZCA9ICAoKSA9PiB7XG5cbn07XG5cbnZhciBzdWJtaXRGb3JtID0gKG5hbWUpID0+IHtcbiAgICBpZiAoY2hlY2tJbnB1dEZvckVycm9ycyhuYW1lKSkge1xuICAgICAgICB2YXIgeG1saHR0cDtcbiAgICAgICAgaWYgKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCkgey8vIGNvZGUgZm9yIElFNyssIEZpcmVmb3gsIENocm9tZSwgT3BlcmEsIFNhZmFyaVxuICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB9IGVsc2Ugey8vIGNvZGUgZm9yIElFNiwgSUU1XG4gICAgICAgICAgICB4bWxodHRwID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gICAgICAgIH1cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoeG1saHR0cC5yZWFkeVN0YXRlID09IDQgJiYgeG1saHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHhtbGh0dHAucmVzcG9uc2VUZXh0ID09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zaWRlJykuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyZXNwb25zZU1lc3NhZ2VcIj48aSBjbGFzc1wiPW1kaSBtZGktY2hlY2tcIj48L2k+PC9kaXY+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cIm1hdGVyaWFsIGxpZ2h0IHJhaXNlZFwiIHZhbHVlPVwiQ2xvc2VcIiBvbmNsaWNrPVwiY2xvc2VGb3JtKFxcJ3JlZ2lzdGVyXFwnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcXCdyZWdpc3RlckJ1dHRvblxcJykpO1wiIC8+JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHhtbGh0dHAub3BlbignUE9TVCcsICcvc2F2ZS1zZXR0aW5ncycsIHRydWUpO1xuICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcblxuICAgICAgICB2YXIgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJyk7XG4gICAgICAgIHZhciBhZGRyZXNzTGluZTEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkcmVzc19saW5lXzEnKTtcbiAgICAgICAgdmFyIGFkZHJlc3NMaW5lMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRyZXNzX2xpbmVfMicpO1xuICAgICAgICB2YXIgd2lmaVNTSUQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnV2lGaV9TU0lEJyk7XG4gICAgICAgIHZhciB3aWZpUGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnV2lGaV9wYXNzd29yZCcpO1xuICAgICAgICB4bWxodHRwLnNlbmQoJ25hbWU9JyArIG5hbWUudmFsdWUgKyAnJmFkZHJlc3NMaW5lMT0nICsgYWRkcmVzc0xpbmUxLnZhbHVlICsgJyZhZGRyZXNzTGluZTI9JyArIGFkZHJlc3NMaW5lMi52YWx1ZSArICcmd2lmaVNTSUQ9JyArIHdpZmlTU0lELnZhbHVlICsgJyZ3aWZpUGFzc3dvcmQ9JyArIHdpZmlQYXNzd29yZC52YWx1ZSk7XG4gICAgfVxufTtcblxudmFyIGNoZWNrSW5wdXRGb3JFcnJvcnMgPSAobmFtZSkgPT4ge1xuICAgIHZhciBoYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgdmFyIG5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZScpO1xuICAgIHZhciBhZGRyZXNzTGluZTEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkcmVzc19saW5lXzEnKTtcbiAgICB2YXIgYWRkcmVzc0xpbmUyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZHJlc3NfbGluZV8yJyk7XG4gICAgdmFyIHdpZmlTU0lEID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1dpRmlfU1NJRCcpO1xuICAgIHZhciB3aWZpUGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnV2lGaV9wYXNzd29yZCcpO1xuXG4gICAgaWYgKG5hbWUudmFsdWUgPT09ICcnKSB7XG4gICAgICAgIG5hbWUuc2V0QXR0cmlidXRlKCdlcnJvcicsICcnKTtcbiAgICAgICAgbmFtZS5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnQ2FuIG5vdCBiZSBibGFuayc7XG4gICAgICAgIG5hbWUuZm9jdXMoKTtcbiAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5hbWUucmVtb3ZlQXR0cmlidXRlKCdlcnJvcicpO1xuICAgICAgICBuYW1lLm5leHRTaWJsaW5nLmlubmVySFRNTCA9ICdXZVxcJ3JlIGFsbCBnb29kJztcbiAgICB9XG4gICAgaWYgKGFkZHJlc3NMaW5lMS52YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgYWRkcmVzc0xpbmUxLnNldEF0dHJpYnV0ZSgnZXJyb3InLCAnJyk7XG4gICAgICAgIGFkZHJlc3NMaW5lMS5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnQ2FuIG5vdCBiZSBibGFuayc7XG4gICAgICAgIGFkZHJlc3NMaW5lMS5mb2N1cygpO1xuICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYWRkcmVzc0xpbmUxLnJlbW92ZUF0dHJpYnV0ZSgnZXJyb3InKTtcbiAgICAgICAgYWRkcmVzc0xpbmUxLm5leHRTaWJsaW5nLmlubmVySFRNTCA9ICdXZVxcJ3JlIGFsbCBnb29kJztcbiAgICB9XG4gICAgaWYgKGFkZHJlc3NMaW5lMi52YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgYWRkcmVzc0xpbmUyLnNldEF0dHJpYnV0ZSgnZXJyb3InLCAnJyk7XG4gICAgICAgIGFkZHJlc3NMaW5lMi5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnQ2FuIG5vdCBiZSBibGFuayc7XG4gICAgICAgIGFkZHJlc3NMaW5lMi5mb2N1cygpO1xuICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYWRkcmVzc0xpbmUyLnJlbW92ZUF0dHJpYnV0ZSgnZXJyb3InKTtcbiAgICAgICAgYWRkcmVzc0xpbmUyLm5leHRTaWJsaW5nLmlubmVySFRNTCA9ICdXZVxcJ3JlIGFsbCBnb29kJztcbiAgICB9XG4gICAgaWYgKHdpZmlTU0lELnZhbHVlID09PSAnJykge1xuICAgICAgICB3aWZpU1NJRC5zZXRBdHRyaWJ1dGUoJ2Vycm9yJywgJycpO1xuICAgICAgICB3aWZpU1NJRC5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnQ2FuIG5vdCBiZSBibGFuayc7XG4gICAgICAgIHdpZmlTU0lELmZvY3VzKCk7XG4gICAgICAgIGhhc0Vycm9yID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3aWZpU1NJRC5yZW1vdmVBdHRyaWJ1dGUoJ2Vycm9yJyk7XG4gICAgICAgIHdpZmlTU0lELm5leHRTaWJsaW5nLmlubmVySFRNTCA9ICdXZVxcJ3JlIGFsbCBnb29kJztcbiAgICB9XG4gICAgaWYgKHdpZmlQYXNzd29yZC52YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgd2lmaVBhc3N3b3JkLnNldEF0dHJpYnV0ZSgnZXJyb3InLCAnJyk7XG4gICAgICAgIHdpZmlQYXNzd29yZC5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnQ2FuIG5vdCBiZSBibGFuayc7XG4gICAgICAgIHdpZmlQYXNzd29yZC5mb2N1cygpO1xuICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh3aWZpUGFzc3dvcmQudmFsdWUubGVuZ3RoIDwgNykge1xuICAgICAgICB3aWZpUGFzc3dvcmQuc2V0QXR0cmlidXRlKCdlcnJvcicsICcnKTtcbiAgICAgICAgd2lmaVBhc3N3b3JkLm5leHRTaWJsaW5nLmlubmVySFRNTCA9ICdJbmNvcnJlY3QgcGFzc3dvcmQnO1xuICAgICAgICB3aWZpUGFzc3dvcmQuZm9jdXMoKTtcbiAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZmlQYXNzd29yZC5yZW1vdmVBdHRyaWJ1dGUoJ2Vycm9yJyk7XG4gICAgICAgIHdpZmlQYXNzd29yZC5uZXh0U2libGluZy5pbm5lckhUTUwgPSAnV2VcXCdyZSBhbGwgZ29vZCc7XG4gICAgfVxuXG4gICAgcmV0dXJuICFoYXNFcnJvcjtcbn07XG5cbnZhciBpc0VtYWlsID0gKGVtYWlsKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgZW1haWwubGVuZ3RoID49IDUgJiZcbiAgICAgICAgZW1haWwuaW5kZXhPZignICcpID09IC0xICYmXG4gICAgICAgIGVtYWlsLnNwbGl0KCdAJykubGVuZ3RoID09IDIgJiZcbiAgICAgICAgZW1haWwuc3BsaXQoJy4nKS5sZW5ndGggPT0gMiAmJlxuICAgICAgICBlbWFpbC5pbmRleE9mKCdAJykgPCBlbWFpbC5pbmRleE9mKCcuJykgLSAxICYmXG4gICAgICAgIGVtYWlsLmluZGV4T2YoJ0AnKSAhPSAwICYmXG4gICAgICAgIGVtYWlsLmluZGV4T2YoJy4nKSAhPSBlbWFpbC5sZW5ndGggLSAxXG4gICAgKTtcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
