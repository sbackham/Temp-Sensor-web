import React from "react";
import io from 'socket.io-client';
import Chart from "react-apexcharts";
import ApexCharts from 'apexcharts'

function App() {
  const [pauseData, setPauseData] = React.useState(false);
  const [isCelsius, setIsCelsius] = React.useState(true); // Define this state here at the top
  const [lastTemperature, setLastTemperature] = React.useState(null); // State to hold last received temperature
  const [socket, setSocket] = React.useState(null);
  const [dataStream, setDataStream] = React.useState([
    { x: 0, y: 0 }
  ]);
  const series = [
    {localStorage
      name: 'Temperature',
      data: dataStream.map(point => ({
        x: point.x,
        y: isCelsius ? point.y : toFahrenheit(point.y)
      })) //converts the data points based on C or F selection
    },
  ];
  const options = {

    chart: {
      id: 'realtime',
      type: 'line',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      },
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: true
    },
    stroke: {
      curve: 'smooth'
    },
    title: {
      text: 'Temperature',
      align: 'left'
    },
    markers: {
      size: 2
    },
    xaxis: {
      range: 100,
      type: 'numeric',
      tickAmount: 'dataPoints',
      tickPlacement: 'on'
    },
    yaxis: {
      min: isCelsius ? -50 : toFahrenheit(-50),
      max: isCelsius ? 120 : toFahrenheit(120)
    }};


    // Function to convert Celsius to Fahrenheit
    const toFahrenheit = (celsius) => celsius * 9 / 5 + 32;

    // Function to toggle temperature unit
    const toggleTempUnit = () => setIsCelsius(!isCelsius); // Toggle temperature unit state
  
  

    //var chart = new ApexCharts(document.querySelector("#chart"), options);
    //chart.render();


  async function appendData(dataPoint) {
    var prev = dataStream[dataStream.length - 1]
    if (dataStream.length > 1000) {
      dataStream.reverse().pop()
      dataStream.reverse()
    }
    setDataStream(oldArray => [...oldArray, 
      { x: prev['x'] + 3, y: dataPoint} ]);


  }

  React.useEffect(() => {
    const socket = io.connect('http://localhost:80/', {transports: ['websocket', 'polling', 'flashsocket']});
    setSocket(socket)
    ApexCharts.exec('realtime', 'updateSeries', [{
      data: dataStream
    }])
    return () => {
      console.log('Disconnecting socket...');
      if(socket) socket.disconnect();
    }
  }, [dataStream]);


  if (socket && !pauseData) {
    socket.once("Echo", data => {
      setLastTemperature(data);
      appendData(data).then(console.log(data))
    });
  }

  return (
    <div>
      {/* Displaying the last received temperature in a large font, styled box above the chart */}
      <div style={{
        fontSize: '24px', 
        textAlign: 'center', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        {lastTemperature !== null ? `${lastTemperature} °C` : 'N/A'}
      </div>
      
      <Chart series={series} options={options}  height={1000} />
      <button onClick={() => setPauseData(!pauseData)}>
        Stop/Start Data Stream
      </button>
      <button onClick={toggleTempUnit}>
        Switch to {isCelsius ? 'Fahrenheit' : 'Celsius'}
      </button>
    </div>
  );
}


export default App;
