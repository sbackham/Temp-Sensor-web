import React from "react";
import io from 'socket.io-client';
import Chart from "react-apexcharts";
import ApexChart from 'apexcharts'

function App() {
  const [pauseData, setPauseData] = React.useState(false);
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
      }
    },
    dataLabels: {
      enabled: true
    },
    stroke: {
      curve: 'smooth'
    },
    title: {
      text: 'Temperature in degrees F',
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
    }}


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
    ApexChart.exec('realtime', 'updateSeries', [{
      data: dataStream
    }])
    return () => {
      console.log('Disconnecting socket...');
      if(socket) socket.disconnect();
    }
  }, [dataStream]);


  if (socket && !pauseData) {
    socket.once("Echo", data => {
      appendData(data).then(console.log(data))
    });
  }

  return (
    <div>
      <Chart series={series} options={options}  height={1000} />
      <button onClick={() => setPauseData(!pauseData)}>
        Stop/Start Data Stream
      </button>
    </div>
  );
}


export default App;
