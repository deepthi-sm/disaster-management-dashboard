import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const axis = { fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#5b6e92' }

export function RescueTrend({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#1b2740" strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={axis} tickLine={false} axisLine={{ stroke: '#1b2740' }} minTickGap={24} />
        <YAxis tick={axis} tickLine={false} axisLine={{ stroke: '#1b2740' }} />
        <Tooltip contentStyle={{ background: '#18233b', border: '1px solid #2c3c5e', borderRadius: 8, fontSize: 12, color: '#e9eef9' }} />
        <Line type="monotone" dataKey="rescued" stroke="#36d399" strokeWidth={2.5} dot={{ r: 2.5, fill: '#36d399' }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const TEAM_COLORS = ['#36d399', '#ff8c2a', '#4d9fff', '#5b6e92']

export function TeamDistribution({ teams }) {
  const counts = { available: 0, deployed: 0, returning: 0, 'off-duty': 0 }
  teams.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++ })
  const data = [
    { name: 'Avail', v: counts.available },
    { name: 'Deploy', v: counts.deployed },
    { name: 'Return', v: counts.returning },
    { name: 'Off', v: counts['off-duty'] },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -22 }}>
        <CartesianGrid stroke="#1b2740" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ ...axis, fontFamily: 'DM Sans', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1b2740' }} />
        <YAxis tick={axis} tickLine={false} axisLine={{ stroke: '#1b2740' }} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#18233b', border: '1px solid #2c3c5e', borderRadius: 8, fontSize: 12, color: '#e9eef9' }} />
        <Bar dataKey="v" radius={[5, 5, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={TEAM_COLORS[i]} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
