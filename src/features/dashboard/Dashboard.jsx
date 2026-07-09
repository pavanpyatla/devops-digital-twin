import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Dns,
  Memory,
  Speed,
  NetworkCheck,
  Science,
  TrendingUp,
  Warning,
  Payments,
  Refresh,
  MoreVert,
  Circle,
  CheckCircle,
  Error as ErrorIcon,
  AccessTime,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import MetricCard from '../../components/MetricCard';
import StatusChip from '../../components/StatusChip';
import AlertItem from '../../components/AlertItem';
import { PageSkeleton } from '../../components/LoadingSkeleton';
import { dashboardApi } from '../../services/api';
import { formatCurrency, formatPercent, getRelativeTime, formatDuration } from '../../utils/formatters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const Dashboard = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, simsRes, deploysRes, healthRes, alertsRes] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getRecentSimulations(),
        dashboardApi.getRecentDeployments(),
        dashboardApi.getHealthStatus(),
        dashboardApi.getAlerts(),
      ]);
      setMetrics(metricsRes.data);
      setSimulations(simsRes.data);
      setDeployments(deploysRes.data);
      setHealthStatus(healthRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !metrics) {
    return <PageSkeleton />;
  }

  const chartDataMap = ['cpu', 'memory', 'network'];
  const chartColors = ['#1976D2', '#9C27B0', '#2E7D32'];
  const chartLabels = ['CPU Usage (%)', 'Memory Usage (%)', 'Network (Mbps)'];
  const currentChartData = metrics.trends[chartDataMap[chartTab]];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time overview of your DevOps infrastructure
              </Typography>
            </Box>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchData} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </motion.div>

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Active Services', value: metrics.activeServices, icon: <Dns />, color: 'primary', trend: 'up', trendValue: '+3', subtitle: 'All namespaces' },
            { title: 'Running Pods', value: metrics.runningPods, icon: <Memory />, color: 'info', trend: 'up', trendValue: '+12', subtitle: 'Across 4 clusters' },
            { title: 'CPU Usage', value: formatPercent(metrics.cpuUsage), icon: <Speed />, color: metrics.cpuUsage > 80 ? 'error' : metrics.cpuUsage > 60 ? 'warning' : 'success', trend: 'up', trendValue: '+5.2%' },
            { title: 'Memory Usage', value: formatPercent(metrics.memoryUsage), icon: <Memory />, color: metrics.memoryUsage > 80 ? 'error' : metrics.memoryUsage > 60 ? 'warning' : 'success', trend: 'down', trendValue: '-2.1%' },
            { title: 'Network Traffic', value: `${metrics.networkTraffic}`, unit: 'Mbps', icon: <NetworkCheck />, color: 'primary', trend: 'up', trendValue: '+8.4%' },
            { title: 'Active Simulations', value: metrics.activeSimulations, icon: <Science />, color: 'info', trend: 'up', trendValue: '+2' },
            { title: 'Risk Score', value: metrics.riskScore, icon: <Warning />, color: metrics.riskScore > 70 ? 'error' : metrics.riskScore > 40 ? 'warning' : 'success', trend: 'down', trendValue: '-4pts' },
            { title: 'Monthly Cost', value: formatCurrency(metrics.monthlyCost), icon: <Payments />, color: 'warning', trend: 'up', trendValue: '+3.2%' },
          ].map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.title}>
              <motion.div variants={itemVariants}>
                <MetricCard {...metric} />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Charts + Health Status */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Trend Charts */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={600}>
                      Resource Trends
                    </Typography>
                  }
                  action={
                    <Tabs
                      value={chartTab}
                      onChange={(_, v) => setChartTab(v)}
                      sx={{
                        '& .MuiTab-root': { minWidth: 'auto', px: 2, py: 1 },
                        '& .MuiTabs-indicator': { height: 3 },
                      }}
                    >
                      <Tab label="CPU" />
                      <Tab label="Memory" />
                      <Tab label="Network" />
                    </Tabs>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={currentChartData}>
                      <defs>
                        <linearGradient id={`chartGradient-${chartTab}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors[chartTab]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={chartColors[chartTab]} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={alpha(theme.palette.text.secondary, 0.1)}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColors[chartTab]}
                        strokeWidth={2.5}
                        fill={`url(#chartGradient-${chartTab})`}
                        name={chartLabels[chartTab]}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Service Health */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={600}>
                      Service Health
                    </Typography>
                  }
                  action={
                    <Chip
                      label={healthStatus?.overall === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
                      size="small"
                      color={healthStatus?.overall === 'healthy' ? 'success' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {healthStatus?.services.map((service) => {
                      const statusColor =
                        service.status === 'healthy' ? theme.palette.success.main
                          : service.status === 'warning' ? theme.palette.warning.main
                            : theme.palette.error.main;
                      return (
                        <Box key={service.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Circle sx={{ fontSize: 10, color: statusColor }} />
                              <Typography variant="body2" fontWeight={500}>
                                {service.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {service.uptime}% uptime
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={service.uptime}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(statusColor, 0.15),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: statusColor,
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Alerts + Deployments + Simulations */}
        <Grid container spacing={3}>
          {/* Active Alerts */}
          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Active Alerts
                      </Typography>
                      <Chip
                        label={alerts.filter((a) => !a.acknowledged).length}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700, minWidth: 28, height: 22 }}
                      />
                    </Box>
                  }
                />
                <CardContent sx={{ pt: 0, maxHeight: 400, overflowY: 'auto' }}>
                  <AnimatePresence>
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <AlertItem alert={alert} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Deployments */}
          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={600}>
                      Recent Deployments
                    </Typography>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {deployments.slice(0, 5).map((deploy) => (
                      <Box
                        key={deploy.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.action.hover, 0.04),
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.action.hover, 0.08),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {deploy.service}
                          </Typography>
                          <StatusChip status={deploy.status} size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            v{deploy.version} • {formatDuration(deploy.duration)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeTime(deploy.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Simulations */}
          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={600}>
                      Recent Simulations
                    </Typography>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {simulations.slice(0, 5).map((sim) => (
                      <Box
                        key={sim.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.action.hover, 0.04),
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.action.hover, 0.08),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                            {sim.name}
                          </Typography>
                          <StatusChip status={sim.status} size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {sim.riskScore !== null ? `Risk: ${sim.riskScore}%` : 'In progress...'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeTime(sim.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Dashboard;