import React, { useState, useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const scores = [6, 4, 5, 4, 3, 5, 6];
const labels = [100, 200, 300, 400, 500, 600, 700];

const options = {
    responsive: true,
}

export default function LineChart() {
    const data = useMemo(function () {
        return {
            datasets: [
                {
                    label: "Mis datos",
                    data: scores,
                }
            ]
        }
    }, [])
    return <Line data={data} options={options} />
}