import { NextUIProvider } from "@nextui-org/react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Root from "./routes/root.tsx";
import Index from "./routes";
import Map from "./routes/map.tsx";
import Photo from "./routes/photo.tsx";
import Prefecture from "./routes/prefecture.tsx";

function App() {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <Routes>
        <Route path="/" element={<Root/>}>
          <Route path="" element={<Index/>}/>
          <Route path="map" element={<Map/>}/>
          <Route path="photo/:id" element={<Photo/>}/>
          <Route path="prefecture/:prefectureId" element={<Prefecture/>}/>
          <Route path="prefecture/:prefectureId/city/:cityId" element={<Prefecture/>}/>
        </Route>
      </Routes>
    </NextUIProvider>
  )
}

export default App
