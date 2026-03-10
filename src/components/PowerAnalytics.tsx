import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Zap, Calendar, TrendingUp, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DailyData {
  date: string;
  kwh: number;
  peakWatts: number;
}

interface MonthlyData {
  month: string;
  avgKwh: number;
  totalKwh: number;
}

interface PowerAnalyticsProps {
  dailyData: DailyData[];
  monthlyData: MonthlyData[];
  vecoRate: number;
  onVecoRateChange: (rate: number) => void;
  isAdmin?: boolean;
}

export function PowerAnalytics({ dailyData, monthlyData, vecoRate, onVecoRateChange, isAdmin }: PowerAnalyticsProps) {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [editRate, setEditRate] = useState(vecoRate.toString());
  // Daily stats
  const dailyStats = useMemo(() => {
    if (dailyData.length === 0) return { total: 0, avg: 0, max: 0 };
    const total = dailyData.reduce((sum, d) => sum + d.kwh, 0);
    const avg = total / dailyData.length;
    const max = Math.max(...dailyData.map((d) => d.kwh));
    return { total, avg, max };
  }, [dailyData]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    if (monthlyData.length === 0) return { avgMonthly: 0, totalYear: 0 };
    const totalYear = monthlyData.reduce((sum, m) => sum + m.totalKwh, 0);
    const avgMonthly = totalYear / monthlyData.length;
    return { avgMonthly, totalYear };
  }, [monthlyData]);

  const handleSaveRate = () => {
    const parsed = parseFloat(editRate);
    if (!isNaN(parsed) && parsed > 0) {
      onVecoRateChange(parsed);
      setIsEditingRate(false);
    }
  };

  const handleCancelEdit = () => {
    setEditRate(vecoRate.toString());
    setIsEditingRate(false);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Zap className="w-4 h-4 text-sensor-power" />
            Power Consumption Analytics
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-medium">VECO Rate:</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-20 h-7 text-sm"
                  autoFocus
                />
                <span className="text-muted-foreground text-xs">₱/kWh</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveRate}>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">VECO Rate:</span>
                <span className="font-bold text-foreground">{vecoRate.toFixed(2)}</span>
                <span className="text-muted-foreground text-xs">₱/kWh</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditRate(vecoRate.toString()); setIsEditingRate(true); }}>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Monthly
            </TabsTrigger>
          </TabsList>

          {/* Daily Power Consumption Tab */}
          <TabsContent value="daily" className="space-y-4">
            {/* Daily Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="data-label text-xs">7-Day Total</span>
                <div className="font-bold text-lg text-foreground">
                  {dailyStats.total.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="data-label text-xs">Daily Avg</span>
                <div className="font-bold text-lg text-foreground">
                  {dailyStats.avg.toFixed(2)}
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="data-label text-xs">Peak Day</span>
                <div className="font-bold text-lg text-foreground">
                  {dailyStats.max.toFixed(2)}
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </div>
              </div>
            </div>

            {/* Daily Bar Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Usage']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Bar dataKey="kwh" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === dailyData.length - 1
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--primary) / 0.5)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Daily energy consumption over the last 7 days (kWh)
            </p>
          </TabsContent>

          {/* Monthly Power Consumption Tab */}
          <TabsContent value="monthly" className="space-y-4">
            {/* Monthly Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="data-label text-xs">Monthly Average</span>
                <div className="font-bold text-lg text-foreground">
                  {monthlyStats.avgMonthly.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="data-label text-xs">Year Total</span>
                <div className="font-bold text-lg text-foreground">
                  {monthlyStats.totalYear.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </div>
              </div>
            </div>

            {/* Monthly Line Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)} kWh`,
                      name === 'avgKwh' ? 'Daily Avg' : 'Total',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgKwh"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalKwh"
                    stroke="hsl(var(--energy))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--energy))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--energy))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Daily Average</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-energy" />
                <span className="text-muted-foreground">Monthly Total</span>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Average daily consumption and monthly totals (kWh)
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
