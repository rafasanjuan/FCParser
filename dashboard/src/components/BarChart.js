import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  aspectRatio: 1,
  plugins: {
    legend: {
        display: false,
    },
    title: {
      display: false,
      text: 'Histogram',
    },
  },
  scale: {
    ticks: {
        precision:0
    }
  },
  scales: {
      xAxes: [{
          ticks: {
              fixedStepSize: 1
          }
      }],
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];


export default function BarChart(props) {

  const data = {
    labels: props.x,
    datasets: [
      {
        label: 'Dataset ',
        data: props.y,
        backgroundColor: 'rgba(53, 162, 235, 0.8)',
      },
    ],
  };
  return <Bar options={options} data={data} />;
}
