export default function CookiesPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Cookies Policy</h1>
      <p className="mb-4">
        This Cookies Policy explains how <strong>Money Nest</strong> uses
        cookies and similar technologies when you visit our website or use our
        services.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">1. What Are Cookies?</h2>
      <p className="mb-4">
        Cookies are small text files placed on your device to help websites
        function properly, improve user experience, and collect information
        about how the site is used.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        2. How We Use Cookies
      </h2>
      <p className="mb-4">
        Money Nest uses cookies and similar technologies for the following
        purposes:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>To keep you signed in to your account</li>
        <li>To remember your preferences and settings</li>
        <li>To analyze usage and improve our services</li>
        <li>To provide a secure login experience</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        3. Types of Cookies We Use
      </h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          <strong>Essential Cookies:</strong> Required for the website to
          function (e.g., authentication and security).
        </li>
        <li>
          <strong>Functional Cookies:</strong> Help remember user preferences
          and improve usability.
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Used to track usage patterns to
          improve performance (e.g., Google Analytics).
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">4. Managing Cookies</h2>
      <p className="mb-4">
        You can manage or disable cookies through your browser settings. Please
        note that disabling essential cookies may affect the functionality of
        Money Nest and some features may not work properly.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        5. Updates to This Policy
      </h2>
      <p className="mb-4">
        We may update this Cookies Policy from time to time. Any changes will be
        posted on this page with a revised effective date.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">6. Contact Us</h2>
      <p>
        If you have any questions about this Cookies Policy, please contact us
        at{" "}
        <a
          href="mailto:support@codolve.com"
          className="text-indigo-600 underline"
        >
          support@codolve.com
        </a>
        .
      </p>
    </main>
  );
}
