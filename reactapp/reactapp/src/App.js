import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Chart from "react-apexcharts";
import ApexCharts from 'apexcharts';


const toFahrenheit = (celsius) => celsius * 9 / 5 + 32;

function App() {
  const [pauseData, setPauseData] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);
  const [lastTemperature, setLastTemperature] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [displayOn, setDisplayOn] = useState(true);
  const [yAxisRange, setYAxisRange] = useState({min: 10, max: 50});
  const [isUnplugged, setIsUnplugged] = useState(false); //states for button functionality
  const [isSwitchOff, setIsSwitchOff] = useState(false);
  const dataPointWidth = 10;
  const chartContainerRef = useRef();

//const [dataStream, setDataStream] = useState([]);

  
  const [dataStream, setDataStream] = useState([
    { x: 0, y: 0 }
  ]);

  const series = [{
    name: 'Temperature',
    data: dataStream.map(point => ({
      x: point.x,
      y: isCelsius ? point.y : toFahrenheit(point.y)
    }))
  }];

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
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    title: {
      text: 'Temperature',
      align: 'left'
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'numeric',
      tickAmount: 10,
      min: -300,
      max: 0,
      labels: {
          show: true,
          formatter: (value) => 
          `${Math.abs(Math.round(value))} s ago`,
      },
      axisBorder: {
          show: true,
      },
      axisTicks: {
          show: true,
      },
  },
      
  yaxis: {
    min: yAxisRange.min,
    max: yAxisRange.max,
    labels:{
      formatter: (value) => {
        return Math.round(value); //round to nearest whole number
      }
    }
  }
  };

  const turnOnOffDisplay = async () => {
    try {
      const url = displayOn ? 'http://localhost:3001/turnOffDisplay' : 'http://localhost:3001/turnOnDisplay';
      await fetch(url, { method: 'POST' });
      setDisplayOn(!displayOn);
    } catch (error) {
      console.error("There was an error toggling the display: ", error);
    }
  };

  const toggleTempUnit = () => {
    // Calculate the new dataStream first before changing any state
    const convertedDataStream = dataStream.map(point => ({
      ...point,
      y: isCelsius ? toFahrenheit(point.y) : (point.y - 32) * (5 / 9) // convert each y value to the other unit
    }
    ));
    
    // Now, update the states
    setIsCelsius(!isCelsius); // toggle the unit
    setDataStream(convertedDataStream); // set the converted dataStream
    
    // Also, update the y-axis range and series in the same function.
    if (isCelsius) {
      setYAxisRange({ min: 50, max: 122 });
  } else {
      setYAxisRange({ min: 10, max: 50 });
  }

    // Update the series with the new converted dataStream
    ApexCharts.exec('realtime', 'updateOptions', {
      series: [{
          data: convertedDataStream
      }],
      yaxis: {
          min: yAxisRange.min,
          max: yAxisRange.max
      },
      chart: {
          animations: {
              enabled: false
          }
      }
  }, false, true); // true is to force re-rendering.
};


  const appendData = (dataPoint) => {
    setDataStream((prev) => {
        let newArray;
        const newPoint = { x: currentTime, y: dataPoint.y };
        if (prev.length >= 300) {
            newArray = [newPoint, ...prev.slice(0, -1)];
        } else {
            newArray = [newPoint, ...prev];
        }
        return newArray;
    });
    setCurrentTime(currentTime - 1);
};
  


useEffect(() => {
  if (dataStream.length > 300 && chartContainerRef.current) {
    // Calculate the new width
    const newWidth = dataPointWidth * dataStream.length;
    chartContainerRef.current.style.width = `${newWidth}px`;
  }
}, [dataStream.length]);

useEffect(() => {
  ApexCharts.exec('realtime', 'updateOptions', {
      chart: {
          animations: {
              enabled: true
          }
      }
  });
}, [isCelsius]);

  
  useEffect(() => {
    const socket = io.connect('http://localhost:3000/', { transports: ['websocket', 'polling', 'flashsocket'] });
    setSocket(socket);
    return () => {
      console.log('Disconnecting socket...');
      if (socket) socket.disconnect();
    };
  }, []);
  
  useEffect(() => {
    ApexCharts.exec('realtime', 'updateSeries', [{
      data: dataStream
    }]);
  }, [dataStream]);

  useEffect(() => {
    if (socket) {
      socket.on("Echo", data => {
        if (data !== null && !pauseData) {
          setLastTemperature(data);
          appendData({ y: data });
          console.log(data);
        }
      });
    }
  }, [socket, pauseData, currentTime]);

  return (
    <div>
      <div style={{
        fontSize: '36px',
        textAlign: 'center',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        {isUnplugged ? 'Unplugged sensor' 
        : isSwitchOff ? 'No data available'
        :lastTemperature !== null 
    ? `${isCelsius ? lastTemperature : toFahrenheit(lastTemperature)} ${isCelsius ? '°C' : '°F'}` 
    : 'N/A'}
</div>

<div style={{ overflowX: 'auto', overflowY: 'visible', width: '100%' }}>
        {/* Ref to chart container */}
        <div ref={chartContainerRef} style={{ width: `${dataPointWidth * 300}px` }}>
          <Chart series={series} options={options} height={700} />
        </div>
      </div>
      
      <button onClick={() => setPauseData(!pauseData)}>
        {pauseData ? "Start Data Stream" : "Stop Data Stream"}
      </button>
      <button onClick={toggleTempUnit}>
        Switch to {isCelsius ? 'Fahrenheit' : 'Celsius'}
      </button>
      <button onClick={turnOnOffDisplay}>
        Turn {displayOn ? 'Off' : 'On'} Display
      </button>
    </div>
  );
}

export default App;