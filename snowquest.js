const { useState, useEffect } = React;

function App() {

    const [snow, setSnow] = useState(0);
    const [triggerSnow, setTriggerSnow] = useState(false)
    const [countryQ, setCountryQ] = useState([])
    const [allCountries, setAllCountries] = useState([])

    // finds the user's ip address and converts it to coordinates
    // also gets the user's country name and sets countryQ variable
    // then checks if the place has snow
    // if yes, the <p> tag shows the snow level
    // if not, borderEffect is triggered using triggerSnow
    const find = async () => {
        let country_name, latitude, longitude
        await fetch("https://ipgeolocation.abstractapi.com/v1/?api_key=2b545c25db7a49f8a7a5bf95c6b80811")
        .then(response => response.json())
        .then(data => {
            console.log(data.city)
            setCountryQ([data.country])
            latitude = data.latitude
            longitude = data.longitude
        })
        .catch((err) => {
            console.log(err.message);
        });

        console.log(country_name, latitude, longitude)
        let snow = await findSnow(latitude, longitude) // if code doesn't work later, it might be because setSnow hasn't updated snow yet
        if (snow==0) {
            setTriggerSnow(!triggerSnow)
        }
    }

    // borderEffect - triggered by triggerSnow
    // goes through each country in the countryQ and finds the borders of those countries
    // then it sets those countries in the borders variable, thus triggering snowEffect
    useEffect(() => {
        async function fetchData() {
            if (countryQ.length>0) {
                if (snow==0) { //TODO CHANGE LATER
                    countryQ.forEach(async country => {
                        let countryBorders = await findBorders(country)
                        if (countryBorders.length>0) {
                            await setCountryQ(countryBorders)
                        }
                    })
                }
            }
        }
        fetchData()
    }, [triggerSnow])

    // gets a country's name and finds it's borders
    // then sets countryBorders to the found borders
    // returns the borders
    const findBorders = async (country_name) => {
        const countryBorders = []
        await fetch("gdsCountryBorders.json")
        .then(response => response.json())
        .then(data => {
            data.forEach(border => {
                if (border.country_name==country_name) {
                    countryBorders.push(border.country_border_name)
                }
            });
        })
        .catch((err) => {
            console.log(err.message);
        });
        return countryBorders
    }

    // snowEffect - triggered by borders
    // goes through each border in borders and finds the coords of their capitals using findCoords()
    // then checks if each of those capitals have snow
    useEffect(() => {
        console.log(countryQ)
        let countries = [...allCountries]
        if (countryQ.length>1) {
            countryQ.forEach(async country => {
                if (!allCountries.includes(country)) {
                    let latlon = await findCoords(country)
                    console.log(country)
                    let snow = await findSnow(latlon[0], latlon[1])
                    if (snow!=0) {
                        setSnow(country)
                    }
                }
            })
        }
        countries.push(...countryQ)
        setAllCountries(countries)
        if (snow==0) {
            setTriggerSnow(!triggerSnow)
        }
    }, [countryQ])
    
    // finds the coordinates of the capital of a given country
    // returns the coordinates
    const findCoords = async (country) => {
        const coords = []
        await fetch("capitals.json")
        .then(response => response.json())
        .then(data => {
            data.forEach(thisCountry => {
                if (country==thisCountry.CountryName) {
                    coords.push(thisCountry.CapitalLatitude.toFixed(3),thisCountry.CapitalLongitude.toFixed(3))
                }
            });
        })
        .catch((err) => {
            console.log(err.message);
        });
        return coords
    }

    // gets coords, checks if there is snow
    // if yes, sets the snow variable 
    // returns the snow value
    const findSnow = async (latitude, longitude) => {
        console.log(latitude, longitude)
        let snow = 0
        await fetch(`http://api.weatherunlocked.com/api/forecast/${latitude},${longitude}?app_id=2d182198&app_key=c01d5b5be0ce7b94a9f5ff96ef198508`)
        .then(response => response.json())
        .then(async data => {
            snow = data.Days[0].Timeframes[0].snow_accum_cm
            if (snow!=0) {
                await setSnow(snow)
                console.log(`SNOW FOUND AT ${latitude}, ${longitude}`)
            } else {
                console.log(`Snow not found at ${latitude}, ${longitude}`)
            }
        })
        .catch((err) => {
            console.log(err.message);
        });
        return snow
    }

    return (
        <div>
            <button id="find" className="btn btn-dark" onClick={() =>{find()}}>FIND</button>
            <p></p>
            <div>
                {countryQ.length>0 && snow==0 && <p>Loading...</p>}
                {snow!=0 && <h3>{snow}</h3>}
                <hr></hr>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);


// TO-DO
// instead of the `borders` state, use the countryQ to decide which country will be checked next
// Unrealized problem: Yemen is a border of Saudi Arabia and VICE VERSA