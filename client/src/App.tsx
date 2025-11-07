import type { ComponentType } from "react";
import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import ReportsDetail from "./pages/ReportsDetail";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Chat from "./pages/Chat";
import CourseDetail from "./pages/CourseDetail";
import Resumes from "./pages/Resumes";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./_core/hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={withLayout(Dashboard)} />
        <Route path="/reports" component={withLayout(Reports)} />
        <Route path="/reports/detail" component={withLayout(ReportsDetail)} />
        <Route path="/jobs" component={withLayout(Jobs)} />
        <Route path="/job-detail" component={withLayout(JobDetail)} />
        <Route path="/chat" component={withLayout(Chat)} />
        <Route path="/course-detail" component={withLayout(CourseDetail)} />
        <Route path="/resumes" component={withLayout(Resumes)} />
        <Route path="/settings" component={withLayout(Settings)} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="*" component={withLayout(NotFound)} />
      </Switch>
    </AuthProvider>
  );
}

function withLayout(Component: ComponentType) {
  return function Wrapped() {
    return (
      <AppLayout>
        <Component />
      </AppLayout>
    );
  };
}
