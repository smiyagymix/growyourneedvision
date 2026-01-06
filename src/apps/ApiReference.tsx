
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const ApiReference: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-300 font-mono overflow-x-hidden">
      <header className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#252526]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <OwnerIcon name="CommandLineIcon" className="w-5 h-5 text-green-500" />
              <span className="font-bold text-white">API v2</span>
          </div>
          <div className="text-xs text-gray-500">Base URL: <span className="text-white bg-black px-2 py-1 rounded">https://api.growyourneed.com/v2</span></div>
      </header>

      <div className="flex">
          {/* Nav */}
          <div className="w-64 border-r border-[#333] py-6 hidden md:block h-[calc(100vh-64px)] sticky top-16 bg-[#1e1e1e] overflow-y-auto">
              <div className="px-4 mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Authentication</h4>
                  <button className="block w-full text-left text-sm text-white py-1 px-2 bg-[#333] rounded">Overview</button>
                  <button className="block w-full text-left text-sm text-gray-400 py-1 px-2 hover:text-white">API Keys</button>
              </div>
              <div className="px-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Endpoints</h4>
                  <button className="block w-full text-left text-sm text-green-400 py-1 px-2 hover:text-white">GET /tenants</button>
                  <button className="block w-full text-left text-sm text-blue-400 py-1 px-2 hover:text-white">POST /tenants</button>
                  <button className="block w-full text-left text-sm text-yellow-400 py-1 px-2 hover:text-white">PUT /tenants/:id</button>
                  <button className="block w-full text-left text-sm text-red-400 py-1 px-2 hover:text-white">DELETE /tenants/:id</button>
              </div>
          </div>

          {/* Main */}
          <div className="flex-1 p-8 md:p-12">
              <h1 className="text-3xl text-white font-bold mb-4">Authentication</h1>
              <p className="mb-8 max-w-3xl">The API uses Bearer Token authentication. You must include your secret API key in the Authorization header of every request.</p>

              <div className="bg-[#0d0d0d] rounded-lg border border-[#333] p-6 mb-12">
                  <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                      <span className="text-xs text-gray-500">BASH</span>
                      <button className="text-xs text-gray-500 hover:text-white">COPY</button>
                  </div>
                  <code className="text-sm text-green-400 block">
                      curl https://api.growyourneed.com/v2/tenants \<br/>
                      &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br/>
                      &nbsp;&nbsp;-H "Content-Type: application/json"
                  </code>
              </div>

              <h2 className="text-2xl text-white font-bold mb-4 mt-12">List All Tenants</h2>
              <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs font-bold">GET</span>
                  <span className="text-white font-mono bg-[#333] px-2 py-1 rounded text-sm">/v2/tenants</span>
              </div>
              <p className="mb-6">Retrieves a paginated list of tenants associated with your account.</p>

              <h3 className="text-white font-bold mb-2">Response</h3>
              <div className="bg-[#0d0d0d] rounded-lg border border-[#333] p-6">
                  <code className="text-sm text-blue-300 block whitespace-pre">
{`{
  "data": [
    {
      "id": "tn_12345",
      "name": "Green Valley High",
      "status": "active",
      "users_count": 450
    }
  ],
  "meta": {
    "page": 1,
    "total": 1
  }
}`}
                  </code>
              </div>
          </div>
      </div>
      <LandingFooter />
    </div>
  );
};

export default ApiReference;
    