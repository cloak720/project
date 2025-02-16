import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white shadow-md rounded-lg p-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Terms and Conditions</h1>
            <p className="text-gray-600 mb-4">
              Welcome to Neighbor-Aid! By using our services, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, please do not use our services.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">2. Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              Your use of the site is also subject to our Privacy Policy. Please review our Privacy Policy to understand our practices.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">3. Volunteer and User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              As a volunteer or user, you are responsible for providing accurate information during registration. You also agree to act respectfully toward others while using our platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">4. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              Neighbor-Aid is not liable for any damages that may occur from using our platform, including but not limited to loss of data or service interruptions.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">5. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              Neighbor-Aid reserves the right to modify these terms at any time. Continued use of the platform after changes implies acceptance of the updated terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-700 mt-4">6. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these terms, please contact us at support@neighbor-aid.com.
            </p>

            <div className="text-center mt-6">
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => window.history.back()}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
