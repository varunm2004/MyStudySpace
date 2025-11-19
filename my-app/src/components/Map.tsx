'use client';

import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps"; // Removed APIProvider

type StudySpot = {
  _id: string;
  name: string;
  description: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  tags: string[];
  image?: string; 
};

type MapProps = {
  studySpots: StudySpot[];
}

const MapComponent = (props: MapProps) => {
  const {studySpots} = props;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <GoogleMap
        defaultCenter={{ lat: 33.950328, lng: -83.374389 }}
        defaultZoom={15}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        className="w-full h-full"
      >
        {studySpots.map((spot) => ( 
          <AdvancedMarker key={spot._id} position={spot.coordinates}>
            <img
              src="/images/OrangePin.png"
              alt={spot.name}
              className="max-h-10 object-contain"
            />
          </AdvancedMarker>
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;