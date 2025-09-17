import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  HeadphonesIcon,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
              Touch
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about Money Nest? We're here to help you build your
            financial future.
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Mail className="h-8 w-8 text-indigo-600" />,
                title: "Email Us",
                description:
                  "Send us an email and we'll respond within 24 hours",
                contact: "support@moneynest.com",
                action: "mailto:support@moneynest.com",
                buttonText: "Send Email",
              },
              {
                icon: <Phone className="h-8 w-8 text-indigo-600" />,
                title: "Call Us",
                description: "Mon-Fri from 8am to 5pm PST",
                contact: "+1 (555) 123-4567",
                action: "tel:+15551234567",
                buttonText: "Call Now",
              },
              {
                icon: <MessageSquare className="h-8 w-8 text-indigo-600" />,
                title: "Live Chat",
                description: "Chat with our support team in real-time",
                contact: "Available 24/7",
                action: "#chat",
                buttonText: "Start Chat",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-3">{item.description}</p>
                <p className="text-indigo-600 font-medium mb-4">
                  {item.contact}
                </p>
                <Link
                  href={item.action}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  {item.buttonText}
                </Link>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Product Feedback</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Send Message
                  <Send className="ml-2 h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Information Sidebar */}
            <div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white mb-8">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">Email</h3>
                      <p className="text-blue-100">support@moneynest.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-blue-100">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">Address</h3>
                      <p className="text-blue-100">
                        123 Financial District
                        <br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">Hours</h3>
                      <p className="text-blue-100">
                        Mon-Fri: 8am - 5pm PST
                        <br />
                        Weekends: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Common Questions
                </h3>
                <div className="space-y-4">
                  {[
                    "How do I reset my password?",
                    "Can I upgrade my plan anytime?",
                    "Do you offer refunds?",
                    "Is my financial data secure?",
                  ].map((question, index) => (
                    <Link
                      key={index}
                      href="/faq"
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center">
                        <HeadphonesIcon className="h-4 w-4 text-indigo-600 mr-2" />
                        <span className="text-gray-700">{question}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/faq"
                  className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all FAQs
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to optimize your finances?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are taking control of their financial
            future with Money Nest.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-all"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
