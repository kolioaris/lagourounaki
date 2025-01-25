import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function Footer() {
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/guides" className="text-gray-400 hover:text-primary-300">
                  Guides
                </Link>
              </li>
              <li>
                <a 
                  href="https://lagourounaki.instatus.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-300 inline-flex items-center gap-1"
                >
                  Status <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-primary-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-primary-300">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © La Gourounaki 2024-2025. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}