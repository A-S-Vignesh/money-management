// import Link from "next/link";
// import Image from "next/image";
// import { Users, Target, Shield, Heart, Award, TrendingUp } from "lucide-react";

// export default function AboutPage() {
//   const teamMembers = [
//     {
//       name: "Sarah Johnson",
//       role: "Founder & CEO",
//       bio: "Former financial advisor with 10+ years of experience in personal finance management.",
//       image: "/team/sarah.jpg",
//     },
//     {
//       name: "Michael Chen",
//       role: "CTO",
//       bio: "Software engineer specializing in fintech solutions and security systems.",
//       image: "/team/michael.jpg",
//     },
//     {
//       name: "Jessica Williams",
//       role: "Product Director",
//       bio: "Product management expert with background in behavioral economics.",
//       image: "/team/jessica.jpg",
//     },
//     {
//       name: "David Rodriguez",
//       role: "Head of Design",
//       bio: "UX/UI specialist focused on creating intuitive financial interfaces.",
//       image: "/team/david.jpg",
//     },
//   ];

//   const values = [
//     {
//       icon: <Shield className="h-8 w-8 text-indigo-600" />,
//       title: "Security First",
//       description:
//         "We prioritize the safety of your financial data with bank-level encryption and security protocols.",
//     },
//     {
//       icon: <Target className="h-8 w-8 text-indigo-600" />,
//       title: "User Empowerment",
//       description:
//         "We believe in providing tools that give you control and understanding of your financial life.",
//     },
//     {
//       icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
//       title: "Continuous Innovation",
//       description:
//         "We're constantly improving our platform to help you stay ahead of your financial goals.",
//     },
//     {
//       icon: <Heart className="h-8 w-8 text-indigo-600" />,
//       title: "Customer Focus",
//       description:
//         "Your success is our success. We build features based on real user needs and feedback.",
//     },
//   ];

//   const stats = [
//     { value: "50,000+", label: "Active Users" },
//     { value: "$2.3B+", label: "Assets Tracked" },
//     { value: "15+", label: "Countries Served" },
//     { value: "98%", label: "Customer Satisfaction" },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Hero Section */}
//       <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//               About{" "}
//               <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
//                 Money Nest
//               </span>
//             </h1>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               We're on a mission to help everyone build a secure financial
//               future through intuitive tools and personalized guidance.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <h2 className="text-3xl font-bold text-gray-900 mb-6">
//                 Our Story
//               </h2>
//               <p className="text-gray-600 mb-4">
//                 Money Nest was founded in 2018 by a team of financial experts
//                 and technologists who were frustrated by the complexity of most
//                 financial tools. We noticed that people either struggled with
//                 spreadsheets or paid high fees for financial advisors, with
//                 little understanding of their actual financial health.
//               </p>
//               <p className="text-gray-600 mb-4">
//                 Our vision was simple: create a platform that makes financial
//                 management accessible to everyone, regardless of their financial
//                 knowledge or income level.
//               </p>
//               <p className="text-gray-600">
//                 Today, Money Nest helps thousands of users track their spending,
//                 plan for the future, and build wealth with confidence.
//               </p>
//             </div>
//             <div className="relative">
//               <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
//                 <div className="text-4xl font-bold mb-4">Our Mission</div>
//                 <p className="text-xl">
//                   To empower people to take control of their financial lives
//                   through intuitive technology, educational resources, and
//                   personalized guidance that makes financial wellness achievable
//                   for everyone.
//                 </p>
//               </div>
//               <div className="absolute -z-10 top-4 left-4 w-full h-full rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200"></div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="py-16 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
//                   {stat.value}
//                 </div>
//                 <div className="text-gray-600">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="py-16 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Our Values
//             </h2>
//             <p className="text-gray-600 max-w-2xl mx-auto">
//               These principles guide everything we do at Money Nest, from
//               product development to customer support.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {values.map((value, index) => (
//               <div
//                 key={index}
//                 className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
//               >
//                 <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
//                   {value.icon}
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-2">
//                   {value.title}
//                 </h3>
//                 <p className="text-gray-600">{value.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Team Section */}
//       <div className="py-16 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
//             <p className="text-gray-600 max-w-2xl mx-auto">
//               Meet the passionate individuals working to make financial wellness
//               accessible to everyone.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {teamMembers.map((member, index) => (
//               <div key={index} className="text-center">
//                 <div className="relative w-32 h-32 mx-auto mb-4">
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
//                   <div className="absolute inset-2 bg-gray-200 rounded-full flex items-center justify-center">
//                     <Users className="h-12 w-12 text-gray-400" />
//                   </div>
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900">
//                   {member.name}
//                 </h3>
//                 <p className="text-indigo-600 mb-2">{member.role}</p>
//                 <p className="text-gray-600">{member.bio}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* CTA Section */}
//       <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-3xl font-bold text-white mb-4">
//             Ready to build your financial nest?
//           </h2>
//           <p className="text-blue-100 max-w-2xl mx-auto mb-8">
//             Join thousands of users who are taking control of their financial
//             future with Money Nest.
//           </p>
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <Link
//               href="/signup"
//               className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg"
//             >
//               Get Started Free
//             </Link>
//             <Link
//               href="/contact"
//               className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600"
//             >
//               Contact Us
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Target,
  Shield,
  Heart,
  Award,
  TrendingUp,
  ArrowRight,
  BarChart,
  PieChart,
  DollarSign,
} from "lucide-react";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      bio: "Former financial advisor with 10+ years of experience in personal finance management.",
      image: "/team/sarah.jpg",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Software engineer specializing in fintech solutions and security systems.",
      image: "/team/michael.jpg",
    },
    {
      name: "Jessica Williams",
      role: "Product Director",
      bio: "Product management expert with background in behavioral economics.",
      image: "/team/jessica.jpg",
    },
    {
      name: "David Rodriguez",
      role: "Head of Design",
      bio: "UX/UI specialist focused on creating intuitive financial interfaces.",
      image: "/team/david.jpg",
    },
  ];

  const values = [
    {
      icon: <Shield className="h-8 w-8 text-indigo-600" />,
      title: "Security First",
      description:
        "We prioritize the safety of your financial data with bank-level encryption and security protocols.",
    },
    {
      icon: <Target className="h-8 w-8 text-indigo-600" />,
      title: "User Empowerment",
      description:
        "We believe in providing tools that give you control and understanding of your financial life.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      title: "Continuous Innovation",
      description:
        "We're constantly improving our platform to help you stay ahead of your financial goals.",
    },
    {
      icon: <Heart className="h-8 w-8 text-indigo-600" />,
      title: "Customer Focus",
      description:
        "Your success is our success. We build features based on real user needs and feedback.",
    },
  ];

  const stats = [
    { value: "50,000+", label: "Active Users" },
    { value: "$2.3B+", label: "Assets Tracked" },
    { value: "15+", label: "Countries Served" },
    { value: "98%", label: "Customer Satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-600/5"></div>
        <div className="absolute top-0 right-0 -mr-40 mt-40 opacity-10">
          <PieChart className="h-64 w-64 text-indigo-600" />
        </div>
        <div className="absolute bottom-0 left-0 -ml-40 mb-40 opacity-10">
          <BarChart className="h-64 w-64 text-blue-600" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">
                Money Nest
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Building Financial Freedom,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                One Nest at a Time
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              At Money Nest, we're revolutionizing how people manage their
              finances through intuitive technology, personalized insights, and
              a commitment to your financial well-being.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-3.5 text-base font-medium rounded-xl text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Story Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-4">
                We founded Money Nest in 2018 with a simple vision: to
                democratize financial wellness by making sophisticated money
                management tools accessible to everyone, regardless of their
                financial knowledge or income level.
              </p>
              <p className="text-gray-600 mb-4">
                Our platform combines cutting-edge technology with financial
                expertise to help you track spending, optimize savings, invest
                wisely, and plan for the future with confidence.
              </p>
              <p className="text-gray-600">
                Today, Money Nest helps thousands of users build their financial
                nests and work toward a more secure future.
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="absolute -top-4 -right-4 bg-white text-indigo-600 p-2 rounded-full shadow-lg">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-lg">
                  To create a world where everyone has the tools, knowledge, and
                  confidence to build lasting financial security and freedom.
                </p>
              </div>
              <div className="absolute -z-10 top-4 left-4 w-full h-full rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do at Money Nest, from
              product development to customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-sm mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the passionate individuals working to make financial wellness
              accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-md"></div>
                  <div className="absolute inset-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-indigo-600 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build your financial nest?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are taking control of their financial
            future with Money Nest.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
