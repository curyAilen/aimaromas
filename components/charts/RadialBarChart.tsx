"use client";

interface Channel {
    name: string;
    value: number;
    color: string;
}

const channels: Channel[] = [
    { name: "WA Cloud", value: 87, color: "#FF7A45" },
    { name: "WA Sessions", value: 72, color: "#FF4D8D" },
    { name: "Telegram", value: 45, color: "#E91E63" },
    { name: "Instagram", value: 87, color: "#A855F7" },
    { name: "Facebook", value: 75, color: "#D946EF" },
];

export function RadialBarChart() {
    const centerX = 200;
    const centerY = 200;
    const innerRadius = 40;
    const maxOuterRadius = 180;
    const angleStep = 180 / channels.length;
    const startAngle = -90;

    return (
        <div className="relative w-full h-[280px] flex items-center justify-center">
            <svg viewBox="0 0 400 220" className="w-full h-full">
                {channels.map((channel, i) => {
                    const angle = startAngle + angleStep * i + angleStep / 2;
                    const rad = (angle * Math.PI) / 180;
                    const outerRadius = innerRadius + (maxOuterRadius - innerRadius) * (channel.value / 100);
                    const x1 = centerX + Math.cos(rad) * innerRadius;
                    const y1 = centerY + Math.sin(rad) * innerRadius;
                    const x2 = centerX + Math.cos(rad) * outerRadius;
                    const y2 = centerY + Math.sin(rad) * outerRadius;
                    const spread = 12; // grados de apertura de cada barra

                    const spreadRad = (spread * Math.PI) / 180;

                    const p1x = centerX + Math.cos(rad - spreadRad / 2) * innerRadius;
                    const p1y = centerY + Math.sin(rad - spreadRad / 2) * innerRadius;
                    const p2x = centerX + Math.cos(rad - spreadRad / 2) * outerRadius;
                    const p2y = centerY + Math.sin(rad - spreadRad / 2) * outerRadius;
                    const p3x = centerX + Math.cos(rad + spreadRad / 2) * outerRadius;
                    const p3y = centerY + Math.sin(rad + spreadRad / 2) * outerRadius;
                    const p4x = centerX + Math.cos(rad + spreadRad / 2) * innerRadius;
                    const p4y = centerY + Math.sin(rad + spreadRad / 2) * innerRadius;

                    const path = [
                        `M ${p1x} ${p1y}`,
                        `L ${p2x} ${p2y}`,
                        `A ${outerRadius} ${outerRadius} 0 0 1 ${p3x} ${p3y}`,
                        `L ${p4x} ${p4y}`,
                        `A ${innerRadius} ${innerRadius} 0 0 0 ${p1x} ${p1y}`,
                        "Z",
                    ].join(" ");

                    const labelRad = rad;
                    const labelR = outerRadius + 20;
                    const labelX = centerX + Math.cos(labelRad) * labelR;
                    const labelY = centerY + Math.sin(labelRad) * labelR;

                    return (
                        <g key={channel.name}>
                            <path d={path} fill={channel.color} opacity={0.9} />
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-text-secondary text-[10px] font-semibold"
                            >
                                {channel.value}%
                            </text>
                            <text
                                x={labelX}
                                y={labelY + 12}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-text-secondary text-[9px]"
                            >
                                {channel.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}