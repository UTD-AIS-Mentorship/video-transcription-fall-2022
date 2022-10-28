
async function fetchData() {
    // const res=await fetch("https://api.coronavirus.data.gov.uk/v1/data");
    // const record=await res.json();
    // document.getElementById("date").innerHTML=record.data[0].date;
    // document.getElementById("areaName").innerHTML=record.data[0].areaName;
    // document.getElementById("latestBy").innerHTML=record.data[0].latestBy;
    // document.getElementById("deathNew").innerHTML=record.data[0].deathNew;
    let url = ""
    
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        url = tabs[0].url;
        // use `url` here inside the callback because it's asynchronous!
        document.getElementById("result").innerHTML=url;
    });

    document.getElementById('button').addEventListener('click',function(){
        document.getElementById("working").innerHTML="LOADING";

        let data = {  
            "id": 20,
            "link": url,
            "summary": "",
            "rating": 5
        };


        const res = fetch("http://53a2-34-170-233-180.ngrok.io/items", {
          method: "POST",
          headers: new Headers({
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": "69420"
          }),
          body: JSON.stringify(data),
          mode: "cors"
        })
        .then(response => response.json())
        .then((data) => {
          console.log("Request complete! response:", data);
          document.getElementById("working").innerHTML=JSON.stringify(data);
        });
        
        //   document.getElementById("working").innerHTML=result    
    })

}

fetchData();

