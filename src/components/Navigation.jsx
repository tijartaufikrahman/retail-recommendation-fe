import { Link } from "react-router";

function Navigation() {
  return (
    <nav className="flex justify-between items-center bg-gray-200 px-6 py-4">
      <h1 className="text-2xl font-bold text-[#1A396D]">
        Is_Active
      </h1>

      <ul className="flex gap-8">
        <li className="hover:bg-[#1A396D] hover:text-white rounded-md px-2 py-1 transition-colors duration-300">
          <Link to="/" className="font-semibold text-slate-800 ">Nav 1 </Link>
        </li>
        <li className="hover:bg-[#1A396D] hover:text-white rounded-md px-2 py-1 transition-colors duration-300">
          <Link to="/Nav2" className="font-semibold text-slate-800 ">Nav 2</Link>
        </li>

        <li className="hover:bg-[#1A396D] hover:text-white rounded-md px-2 py-1 transition-colors duration-300">
          <Link to="/Nav3" className="font-semibold text-slate-800 ">Nav 3</Link>
        </li>

        <li className="hover:bg-[#1A396D] hover:text-white rounded-md px-2 py-1 transition-colors duration-300">
          <Link to="/Nav5" className="font-semibold text-slate-800 ">Biodata</Link>
        </li>
        
      </ul>
    </nav>
  );
}

export default Navigation;