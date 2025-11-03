import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import SimpleLogin from "./SimpleLogin.jsx";
import Test from "./Test.jsx";
import TestAnalysis from "./TestAnalysis.jsx";
import DebugAnalysis from "./DebugAnalysis.jsx";
import MinimalAnalysis from "./MinimalAnalysis.jsx";

import Dashboard from "./Dashboard";

import Results from "./Results";

import ArticleGeneration from "./ArticleGeneration";

import GeneratedArticles from "./GeneratedArticles";

import Home from "./Home";

import NewAnalysis from "./newanalysis";

import start from "./start";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Login: Login,
    SimpleLogin: SimpleLogin,
    Test: Test,
    TestAnalysis: TestAnalysis,
    DebugAnalysis: DebugAnalysis,
    MinimalAnalysis: MinimalAnalysis,
    
    Dashboard: Dashboard,
    
    Results: Results,
    
    ArticleGeneration: ArticleGeneration,
    
    GeneratedArticles: GeneratedArticles,
    
    Home: Home,
    
    newanalysis: NewAnalysis,
    
    start: start,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>            
            <Route path="/Login" element={<Login />} />
            <Route path="/SimpleLogin" element={<SimpleLogin />} />
            <Route path="/Test" element={<Test />} />
            <Route path="/TestAnalysis" element={<Layout currentPageName="TestAnalysis"><TestAnalysis /></Layout>} />
            <Route path="/DebugAnalysis" element={<Layout currentPageName="DebugAnalysis"><DebugAnalysis /></Layout>} />
            <Route path="/MinimalAnalysis" element={<Layout currentPageName="MinimalAnalysis"><MinimalAnalysis /></Layout>} />
            
            <Route path="/" element={<Layout currentPageName="Dashboard"><Dashboard /></Layout>} />
            
            <Route path="/Dashboard" element={<Layout currentPageName="Dashboard"><Dashboard /></Layout>} />
            
            <Route path="/Results" element={<Layout currentPageName="Results"><Results /></Layout>} />
            
            <Route path="/ArticleGeneration" element={<Layout currentPageName="ArticleGeneration"><ArticleGeneration /></Layout>} />
            
            <Route path="/GeneratedArticles" element={<Layout currentPageName="GeneratedArticles"><GeneratedArticles /></Layout>} />
            
            <Route path="/Home" element={<Layout currentPageName="Home"><Home /></Layout>} />
            
            <Route path="/newanalysis" element={<Layout currentPageName="newanalysis"><NewAnalysis /></Layout>} />
            
            <Route path="/start" element={<Layout currentPageName="start"><start /></Layout>} />
            
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}