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

    //get all options from the dropdown
    var dropdown = document.getElementById("resolver");
    var options = dropdown.options;
    var resolverListElements = []

    //add a text element to the id "ResolverList" for each resolver in the resolvers array
    for (var i = 0; i < options.length; i++) {
        var resolverURL = options[i].value;
        var resolverName = options[i].text;
        var resolverElement = document.createElement("text");
        resolverElement.innerText = resolverName;
        resolverElement.url = resolverURL;
        var element = document.getElementById("ResolverList").appendChild(resolverElement);
        resolverListElements.push(element);
    }

    //add a callback every 5 seconds to check if the resolvers are up or down
    checkResolvers(resolverListElements);
    /*
    setInterval(function () {
        checkResolvers(resolverListElements);
    }, 5000);
    */
});

async function checkResolvers(resolverListElements) {
    //loop through each element in resolverListElements and set it to green or red depending on if the resolver is up or down
    for (var i = 0; i < resolverListElements.length; i++) {
        var resolverElement = resolverListElements[i];
        var resolverURL = resolverElement.url;
        //remove the /?url= from the end of the url
        //resolverURL = resolverURL + "https://www.youtube.com/watch?v=cOlTz0YDDOY";
        //wait for the ping to finish before moving on to the next resolver
        await pingServer(resolverURL, resolverElement);
    }
}

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

//ping a server and return if it is up or down
async function pingServer(url, resolverElement) {
    return new Promise(function (resolve, reject) {
        console.log("pinging " + url);
        fetch(url, { 'mode': 'no-cors', 'cache': 'no-cache' }).then(function (response) {
            if(response.status == 0){
                resolverElement.style.color = "green";
            } else {
                resolverElement.style.color = "red";
            }
            console.log("done pinging " + url + " with status " + response.status);
            resolve();
        }).catch(function (error) {
            resolverElement.style.color = "red";
            console.log("done pinging " + url + " with error " + error);
            resolve();
        });
    });
}