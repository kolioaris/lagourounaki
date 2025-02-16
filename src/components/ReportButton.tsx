import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Flag, X } from 'lucide-react';

interface ReportButtonProps {
  type: 'profile' | 'post';
  targetId: string;
}

export function ReportButton({ type, targetId }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Harassment',
    'Hate Speech',
    'Inappropriate Content',
    'Spam',
    'Misinformation',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reason = selectedReason === 'Other' ? otherReason : selectedReason;
      const reportData = {
        reporter_id: user.id,
        reason,
        details: selectedReason === 'Other' ? null : otherReason
      };

      if (type === 'profile') {
        reportData['reported_id'] = targetId;
      } else {
        reportData['post_id'] = targetId;
      }

      await supabase.from('reports').insert(reportData);
      setShowModal(false);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
      >
        <Flag size={18} />
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6">Report {type}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium mb-2">
                  Reason
                </label>
                <div className="space-y-2">
                  {reasons.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === 'Other' ? (
                <div>
                  <label className="block text-lg font-medium mb-2">
                    Please specify
                  </label>
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Enter your reason..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    rows={3}
                    required
                  />
                </div>
              ) : selectedReason && (
                <div>
                  <label className="block text-lg font-medium mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Provide any additional details..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                    rows={3}
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedReason || (selectedReason === 'Other' && !otherReason) || isSubmitting}
                className={`w-full py-3 text-lg font-semibold bg-red-500 text-white rounded-lg transition-colors ${
                  isSubmitting || !selectedReason || (selectedReason === 'Other' && !otherReason)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-red-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}