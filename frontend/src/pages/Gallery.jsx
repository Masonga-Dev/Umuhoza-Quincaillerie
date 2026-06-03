import { useEffect, useState } from 'react';
import API from '../api';

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const response = await API.get('/public/gallery');
        setImages(response.data);
      } catch (err) {
        setError('Failed to load gallery images');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Gallery</h1>
        <p className="mt-2 text-slate-600">Explore our products and showroom</p>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <img
                src={`/uploads/gallery/${image.filename}`}
                alt={image.title || 'Gallery image'}
                className="h-64 w-full object-cover"
              />
              {image.title && (
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{image.title}</h3>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No gallery images available at the moment</p>
        </div>
      )}
    </div>
  );
}

export default Gallery;
