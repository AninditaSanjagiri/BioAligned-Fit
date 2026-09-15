import { motion } from "framer-motion";

export default function VideoLibrary() {
  const library = [
    {
      category: "Lower Body Focus",
      videos: [
        { title: "Perfect Romanian Deadlift (RDL)", creator: "Megsquats", url: "https://www.youtube.com/embed/JCXUYuzwGVs" },
        { title: "Bulgarian Split Squat Tutorial", creator: "Renaissance Periodization", url: "https://www.youtube.com/embed/2C-uNgKwPLE" }
      ]
    },
    {
      category: "Core & Pelvic Floor (Luteal/Menstrual)",
      videos: [
        { title: "Deep Core Engagement", creator: "Doc Jen Fit", url: "https://www.youtube.com/embed/vMhqt7r3HJ0" },
        { title: "Parasympathetic Reset Breathing", creator: "Squat University", url: "https://www.youtube.com/embed/_QdwzvtXQ" }
      ]
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full pt-4 pb-12">
      
      <div className="mb-10">
        <h2 className="text-4xl font-serif text-gray-900 mb-2">Form & Technique</h2>
        <p className="text-gray-500">Master your movements. All instructional content is sourced and credited directly to verified creators.</p>
      </div>

      <div className="space-y-12">
        {library.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">{section.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section.videos.map((vid, vIdx) => (
                <div key={vIdx} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="relative w-full pt-[56.25%] rounded-[1.5rem] overflow-hidden bg-gray-900 mb-4">
                    <iframe 
                      className="absolute inset-0 w-full h-full" 
                      src={vid.url} 
                      title={vid.title} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="px-2">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{vid.title}</h4>
                    <p className="text-sm text-purple-600 font-medium">Instructor: {vid.creator}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}