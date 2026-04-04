import { categories, discussPosts } from "../components/mock/discuss";
import { 
  Briefcase, DollarSign, TrendingUp, BookOpen, MessageSquare, 
  ChevronUp, MessageCircle, Eye, Search, PlusCircle
} from "lucide-react";

export default function Discuss() {
  
  // Icon Mapping
  const IconMap = {
    Briefcase,
    DollarSign,
    TrendingUp,
    BookOpen,
    MessageSquare
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 transition-colors duration-300">
      
      {/* Left Sidebar - Categories */}
      <div className="w-full md:w-1/4 flex flex-col gap-6">
        <div>
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-lg shadow-lg transition">
            <PlusCircle size={20} />
            New Topic
          </button>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg sticky top-24 transition-colors duration-300">
          <h2 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-4 px-2">Categories</h2>
          <div className="flex flex-col gap-1">
            {categories.map(cat => {
              const Icon = IconMap[cat.icon];
              return (
                <button 
                  key={cat.id} 
                  className="flex items-center justify-between text-sm py-2.5 px-3 rounded-lg hover:bg-gray-800 hover:text-white transition group"
                >
                  <div className="flex items-center gap-3 text-gray-300 group-hover:text-orange-400 transition">
                    <Icon size={18} />
                    <span className="font-medium text-gray-200">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-sub)' }}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content - Posts Feed */}
      <div className="w-full md:w-3/4 flex flex-col gap-6">
        
        {/* Search Bar */}
        <div className="bg-[var(--bg-card)] p-2 rounded-xl flex items-center border border-[var(--border-line)] shadow-sm relative transition-colors duration-300">
           <Search className="absolute left-4 w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-sub)' }} />
           <input 
             type="text" 
             placeholder="Search topics..."
             className="w-full bg-transparent border-none text-sm px-12 py-2 focus:outline-none"
             style={{ color: 'var(--text-main)' }}
           />
        </div>
        
        {/* Posts List */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] shadow-lg overflow-hidden flex flex-col divide-y divide-[var(--border-line)] transition-colors duration-300">
          
          <div className="px-6 py-4 flex justify-between items-center border-b border-[var(--border-line)]" style={{ backgroundColor: 'var(--bg-header-start)' }}>
             <div className="flex gap-6 text-sm font-medium">
               <button className="text-orange-400 border-b-2 border-orange-400 pb-1 -mb-4">Hot</button>
               <button className="text-gray-400 hover:text-white transition">Newest</button>
               <button className="text-gray-400 hover:text-white transition">Top</button>
             </div>
          </div>

          {discussPosts.map(post => (
            <div key={post.id} className="p-6 flex flex-col md:flex-row gap-4 md:items-center hover:bg-[var(--bg-alt)] transition cursor-pointer">
              
              {/* Upvote Component */}
              <div className="hidden md:flex flex-col items-center px-3 py-2 rounded-md border border-[var(--border-line)] w-16" style={{ backgroundColor: 'var(--bg-header-start)' }}>
                 <ChevronUp className="text-gray-400 hover:text-orange-500 cursor-pointer" size={20} />
                 <span className="font-semibold text-gray-200 my-1">{post.votes}</span>
              </div>

              {/* Central Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">• {post.timeAgo}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 leading-tight hover:text-orange-400 transition" style={{ color: 'var(--text-main)' }}>
                  {post.title}
                </h3>
                
                <div className="flex items-center gap-2">
                   <img src={post.avatar} alt={post.author} className="w-6 h-6 rounded-full bg-gray-800" />
                   <span className="text-sm font-medium text-gray-400">{post.author}</span>
                </div>
              </div>

              {/* Stats right side */}
              <div className="flex items-center gap-6 mt-4 md:mt-0 md:pl-4 md:border-l border-gray-700 text-gray-400 text-sm w-32 justify-end">
                 <div className="flex items-center gap-1.5" title="Comments">
                   <MessageCircle size={16} />
                   <span>{post.comments}</span>
                 </div>
                 <div className="flex items-center gap-1.5" title="Views">
                   <Eye size={16} />
                   <span>{post.views}</span>
                 </div>
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}
