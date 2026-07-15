import { HeroUIProvider, Spinner } from "@heroui/react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Root from "./routes/root.tsx";
import Index from "./routes";
import Map from "./routes/map_openlayers.tsx";
import Photo from "./routes/photo.tsx";
import Prefecture from "./routes/prefecture.tsx";
import "./App.css"
import Mapkit from "./routes/cluster.tsx";
import ShuinList from "./routes/shuin_list.tsx";
import ShuinPage from "./routes/shuin.tsx";
import { DarkModeProvider } from "./contexts/dark_mode_provider.tsx";
import { AuthProvider } from "./contexts/auth_provider.tsx";
import AuthorLogin from "./routes/author_login.tsx";

const AuthorUpload = lazy(() => import("./routes/author_upload.tsx"));

function App() {
  const navigate = useNavigate();

  return (
    <DarkModeProvider>
      <HeroUIProvider navigate={navigate}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Root/>}>
              <Route path="" element={<Index/>}/>
              <Route path="author-login" element={<AuthorLogin/>}/>
              <Route
                path="author-upload"
                element={
                  <Suspense fallback={<div className="flex min-h-64 items-center justify-center"><Spinner/></div>}>
                    <AuthorUpload/>
                  </Suspense>
                }
              />
              <Route path="map" element={<Map/>}/>
              <Route path="shuin" element={<ShuinList/>}/>
              <Route path="cluster" element={<Mapkit/>}/>
              <Route path="photo/:id" element={<Photo/>}/>
              <Route path="shuin/:id" element={<ShuinPage/>}/>
              <Route path="prefecture/:prefectureId" element={<Prefecture/>}/>
              <Route path="prefecture/:prefectureId/city/:cityId" element={<Prefecture/>}/>
            </Route>
          </Routes>
        </AuthProvider>
      </HeroUIProvider>
    </DarkModeProvider>
  )
}

export default App
