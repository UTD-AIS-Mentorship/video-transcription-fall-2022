// takes submitted star rating
// import {fullPipeline, fullPipelineNoPrompt} from './extension_backend.js'; 
// load imports somehow using: https://medium.com/front-end-weekly/es6-modules-in-chrome-extensions-an-introduction-313b3fce955b


let btnShow = document.querySelector("button");
let result = document.querySelector("h4");
btnShow.addEventListener("click", () => {
  let selected = document.querySelector('input[type="radio"]:checked');
  result.innerText = "thanks! rating: " + selected.value;
  // @TODO: select.value is the rating between 1 and 5. Send this to the model.
});
async function fetchData() {
    let url = ""
    
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        url = tabs[0].url;
        console.log(url)
        // use `url` here inside the callback because it's asynchronous!
        
        document.getElementById("result").innerHTML=url; // pass this variable into a new "getTranscript(url)" function
                                                          // pass transcript to jacckson func then return summary
                                                          // pass summary to HTML 
    });

    document.getElementById('button').addEventListener('click',function(){
        document.getElementById("working").innerHTML="LOADING";

        let data = url;
        // pass url to a to transcript func
        // pass transcript func to jacksonfunc
        // jacksonfunc returns summary

        // Remove the post request below. It's elsewhere. Instead, just call either fullPipeline or fullPipelineNoPrompt
        
        
        const res = fetch("https://yyy35rmdka.execute-api.us-east-2.amazonaws.com/prod/", {
          method: "POST",
          headers: new Headers({
            'Content-Type': 'application/json',
            // "ngrok-skip-browser-warning": "69420"
          }),
          body: JSON.stringify(data),
          mode: "cors"
        })
        .then(response => response.json())
        .then((data) => {
          console.log("Request complete! response:", data);
          document.getElementById("working").innerHTML=JSON.stringify(data.body);
        });
        

        /*
        result = fullPipeline(data, true);
        document.getElementById("working").innerHTML=result;
        */
    });

    


}

fetchData();

