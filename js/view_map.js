const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55bmFtZSI6IkJpbml5YW0iLCJkZXNjcmlwdGlvbiI6ImJmMzY3OTE3LWE2YzYtNDRmNS1hOTVhLTA0N2U2N2QxOTNhNSIsImlkIjoiNjhjNTk0ZWUtYzQ0Mi00ZThmLWFjM2EtYTIwNWY5ZDlkM2EwIiwiaXNzdWVkX2F0IjoxNzYzNzMwNzQyLCJpc3N1ZXIiOiJodHRwczovL21hcGFwaS5nZWJldGEuYXBwIiwiand0X2lkIjoiMCIsInNjb3BlcyI6WyJGRUFUVVJFX0FMTCJdLCJ1c2VybmFtZSI6ImJpbmlLaW4ifQ.kTxObg3G8jK_6DwkQKAByQdOuuwyej89kaKX59xRGFI'

async function fetchMap() {
    const res = fetch(`https://mapapi.gebeta.app/api/route/direction/?origin={8.989022,38.79036}&destination={9.03045,38.76530}&apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}