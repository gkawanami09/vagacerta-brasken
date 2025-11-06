import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Jobs from "@/pages/Jobs";
import JobDetail from "@/pages/JobDetail";
import Chat from "@/pages/Chat";
import Resumes from "@/pages/Resumes";
import Settings from "@/pages/Settings";
import ReportsDetail from "@/pages/ReportsDetail";
import CourseDetail from "@/pages/CourseDetail";
import Sidebar from "@/components/Sidebar";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  // Páginas sem sidebar (Home, Login, Signup)
  const noSidebarPages = ['/', '/login', '/signup'];
  const [location] = useLocation();
  const normalizedPath = location.split('?')[0];
  const showSidebar = !noSidebarPages.includes(normalizedPath);

  return (
    <div className="flex">
      {showSidebar && <Sidebar />}
      <div className="flex-1 lg:ml-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/job-detail" component={JobDetail} />
          <Route path="/chat" component={Chat} />
          <Route path="/resumes" component={Resumes} />
          <Route path="/settings" component={Settings} />
          <Route path="/reports" component={ReportsDetail} />
          <Route path="/course-detail" component={CourseDetail} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
