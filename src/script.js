// This is an event listener that detects clicks on our "Start Random Search" button
document.getElementById("convert").addEventListener("click", function () {
    //get the current tab
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        //get the resolver url from the dropdown
        selectedResolver = document.getElementById("resolver").value;
        var formattedTabURL = tabs[0].url;
        switch (document.getElementById("resolver").options[document.getElementById("resolver").selectedIndex].getAttribute("formatType")) {
            case "full":
                formattedTabURL = formattedTabURL;
                break;
            case "id":
                formattedTabURL = extractVideoID(formattedTabURL);
                break;
        }
        var finalURL = selectedResolver + formattedTabURL;
        copyTextToClipboard(finalURL);
    });
});

function extractVideoID(url) {
    var video_id = url.split('v=')[1];
    var ampersandPosition = video_id.indexOf('&');
    if (ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    return video_id;
}

//listen for when the dropdown is changed, and save the selected index to sync storage
document.getElementById("resolver").addEventListener("change", function () {
    chrome.storage.sync.set({ 'resolver': document.getElementById("resolver").value }, function () {
        console.log('Resolver is set to ' + document.getElementById("resolver").value);
    });
});

//check for when index.html is visible, and then load the resolver from sync storage
document.addEventListener('DOMContentLoaded', async function () {
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
        var resolverFormatType = options[i].getAttribute("formatType");
        var resolverElement = document.createElement("text");
        resolverElement.innerText = resolverName;
        resolverElement.url = resolverURL;
        resolverElement.formatType = resolverFormatType;
        var element = document.getElementById("ResolverList").appendChild(resolverElement);
        //append a loading spinner to the end of the resolver element from spinner.html
        //var tempChild = document.createElement("div");
        //element.appendChild(tempChild);
        element.innerHTML = element.innerHTML + await fetchHtmlAsText(chrome.runtime.getURL("spinner.html"));

        resolverListElements.push(element);
    }

    //check for updates
    checkForUpdates();

    //check if each resolver is up or down
    checkResolvers(resolverListElements);
});

function checkForUpdates() {
    //check if the current version is the same as the latest version
    fetch('https://raw.githubusercontent.com/Happyrobot33/VRCYoutube/main/src/manifest.json')
        .then(response => response.json())
        .then(data => {
            //get the current manifest
            console.log("Current version is: " + chrome.runtime.getManifest().version);
            console.log("Latest version is: " + data.version);
            if (chrome.runtime.getManifest().version != data.version) {
                //if the current version is not the same as the latest version, show the update button
                document.getElementById("update").style.display = "block";
                console.log("Update available!");
            }
        });
}

async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}

async function checkResolvers(resolverListElements) {
    //loop through each element in resolverListElements and set it to green or red depending on if the resolver is up or down
    for (var i = 0; i < resolverListElements.length; i++) {
        var resolverElement = resolverListElements[i];
        var resolverURL = resolverElement.url;
        //wait for the ping to finish before moving on to the next resolver
        pingServer(resolverURL, resolverElement);
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
function pingServer(url, resolverElement) {
    var cors_proxy_url = "https://corsproxy.io/?";
    //random youtube video to make sure the resolvers are redirecting properly
    var random_youtube_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

    console.log("pinging " + url);
    console.log("cors proxy url: " + cors_proxy_url + url + random_youtube_url);

    fetch(cors_proxy_url + url + random_youtube_url, { 'mode': 'cors', 'cache': 'no-store', "redirect": 'manual' }).then(function (response) {
        //if opaque redirect, then the resolver is up
        if (response.type == "opaqueredirect") {
            ResolverUp();
        } else {
            //if the response is not ok, then the resolver is down
            ResolverDown();
        }
    });

    function ResolverUp() {
        console.log("resolver " + url + " is up");
        resolverElement.style.color = "green";
        //remove the loading spinner
        resolverElement.innerHTML = resolverElement.innerText;
    }

    function ResolverDown() {
        console.log("resolver " + url + " is down");
        resolverElement.style.color = "red";
        //remove the loading spinner
        resolverElement.innerHTML = resolverElement.innerText;
    }
}
