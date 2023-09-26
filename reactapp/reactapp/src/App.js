import React from "react";
import io from 'socket.io-client';
import Chart from "react-apexcharts";
import ApexCharts from 'apexcharts'

function App() {
  const [pauseData, setPauseData] = React.useState(false);
  const [lastTemperature, setLastTemperature] = React.useState(null); // State to hold last received temperature
  const [socket, setSocket] = React.useState(null);
  const [dataStream, setDataStream] = React.useState([
    { x: 0, y: 0 }
  ]);
  const series = [
    {
      name: 'Temperature',
      data: dataStream
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
      min: -50,
      max: 120
    }};

    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();


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
      
      <Chart series={series} options={options} height={1000} />
      <Chart series={series} options={options}  height={1000} />
      <button onClick={() => setPauseData(!pauseData)}>
        Stop/Start Data Stream
      </button>
    </div>
  );
}


export default App;
