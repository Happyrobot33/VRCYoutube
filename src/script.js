// This is an event listener that detects clicks on our "Start Random Search" button
document.getElementById("convert").addEventListener("click", function () {
    //get the current tab
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        //get the resolver url from the dropdown
        selectedResolver = document.getElementById("resolver").value;
        var finalURL = selectedResolver + tabs[0].url;
        copyTextToClipboard(finalURL);
    });
});

//listen for when the dropdown is changed, and save the selected index to sync storage
document.getElementById("resolver").addEventListener("change", function () {
    chrome.storage.sync.set({ 'resolver': document.getElementById("resolver").value }, function () {
        console.log('Resolver is set to ' + document.getElementById("resolver").value);
    });
});

//check for when index.html is visible, and then load the resolver from sync storage
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(['resolver'], function (result) {
        if (result.resolver) {
            document.getElementById("resolver").value = result.resolver;
        }
    });
});

function copyTextToClipboard(text) {
    //Create a textbox field where we can insert text to. 
    var copyFrom = document.createElement("textarea");

    //set the text element size to 0
    copyFrom.style.position = "fixed";
    copyFrom.style.left = "0px";
    copyFrom.style.top = "0px";

    //Set the text content to be the text you wished to copy.
    copyFrom.textContent = text;

    //Append the textbox field into the body as a child. 
    //"execCommand()" only works when there exists selected text, and the text is inside 
    //document.body (meaning the text is part of a valid rendered HTML element).
    document.body.appendChild(copyFrom);

    //Select all the text!
    copyFrom.select();

    //Execute command
    document.execCommand('copy');

    //(Optional) De-select the text using blur(). 
    copyFrom.blur();

    //Remove the textbox field from the document.body, so no other JavaScript nor 
    //other elements can get access to this.
    document.body.removeChild(copyFrom);

    //make successful notification appear
    var notification = document.getElementById("notification");
    notification.style.display = "block";
    notification.style.position = "unset";

    //make notification disappear after 3 seconds
    setTimeout(function () {
        //remove the style attribute
        notification.removeAttribute("style");
    }, 3000);
}