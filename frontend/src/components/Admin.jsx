import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowLeft
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import Header from "./Header";

const Admin = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    paidUsers: 1280,
    revenue: 45230,
    newReviews: 86,
    retention: 92,
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const stats = [
    { label: "Total Books", value: metrics.totalBooks.toLocaleString("en-US") },
    { label: "Paid Users", value: metrics.paidUsers.toLocaleString("en-US") },
    { label: "Revenue", value: formatCurrency(metrics.revenue) },
    { label: "New Reviews", value: metrics.newReviews.toLocaleString("en-US") },
    { label: "User Retention", value: `${metrics.retention}%` },
  ];

  // === Charts + Trending Data ===
  const monthlyRevenueData = [
    { month: "Jan", revenue: 3000, subscriptions: 200 },
    { month: "Feb", revenue: 4200, subscriptions: 260 },
    { month: "Mar", revenue: 5100, subscriptions: 280 },
    { month: "Apr", revenue: 4800, subscriptions: 275 },
    { month: "May", revenue: 6000, subscriptions: 320 },
    { month: "Jun", revenue: 7200, subscriptions: 350 },
  ];

  const trendingBooks = [
    { title: "Atomic Habits", downloads: 982 },
    { title: "1984", downloads: 863 },
    { title: "The Alchemist", downloads: 741 },
    { title: "To Kill a Mockingbird", downloads: 689 },
    { title: "Dune", downloads: 605 },
  ];

  const genreData = [
    { name: "Fiction", value: 400 },
    { name: "Sci-Fi", value: 300 },
    { name: "Fantasy", value: 250 },
    { name: "Non-Fiction", value: 200 },
    { name: "Mystery", value: 150 },
  ];
  const genreColors = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444"];

  // === Form State ===
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    author: "",
    description: "",
    genre: "",
    language: "",
    subjects: "",
    cover_image: "",
    pdf_file: null,
    cover_file: null,
    downloads: 0,
  });

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      // If no books exist, seed 40 default books
      if (!data || data.length === 0) {
        const seedBooks = Array.from({ length: 40 }, (_, i) => ({
          id: `book-${Date.now()}-${i}`,
          title: `Sample Book ${i + 1}`,
          author: `Author ${i + 1}`,
          description: `This is a sample description for book ${i + 1}.`,
          genre: ["Fiction", "Sci-Fi", "Romance", "Thriller", "Mystery"][i % 5],
          language: "English",
          subjects: ["Reading", "Learning", "Adventure"],
          cover_image: "https://placehold.co/200x300?text=Book+Cover",
          pdf_file: "sample.pdf",
          downloads: Math.floor(Math.random() * 500),
        }));

        const { error: insertError } = await supabase.from("books").insert(seedBooks);
        if (insertError) throw insertError;
        setBooks(seedBooks);
      } else {
        setBooks(data);
      }

      setMetrics((prev) => ({
        ...prev,
        totalBooks: (data?.length || 40),
      }));
    } catch (error) {
      console.error("Error loading books:", error);
      alert("Failed to load books: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let pdfFileName = formData.pdf_file;
      let coverImageUrl = formData.cover_image;

      if (formData.pdf_file instanceof File) {
        const pdfPath = `books/${formData.id || Date.now()}-${formData.pdf_file.name}`;
        pdfFileName = await uploadFile(formData.pdf_file, "Book-storage", pdfPath);
      }

      if (formData.cover_file instanceof File) {
        const coverPath = `covers/${formData.id || Date.now()}-${formData.cover_file.name}`;
        await uploadFile(formData.cover_file, "Book-storage", coverPath);

        const { data: urlData } = supabase.storage
          .from("Book-storage")
          .getPublicUrl(coverPath);
        coverImageUrl = urlData.publicUrl;
      }

      const bookData = {
        id: formData.id || `book-${Date.now()}`,
        title: formData.title,
        author: formData.author,
        description: formData.description || null,
        genre: formData.genre || null,
        language: formData.language || null,
        subjects: formData.subjects
          ? formData.subjects.split(",").map((s) => s.trim())
          : null,
        cover_image: coverImageUrl || null,
        pdf_file: pdfFileName || null,
        downloads: parseInt(formData.downloads) || 0,
      };

      if (editingBook) {
        const { error } = await supabase
          .from("books")
          .update(bookData)
          .eq("id", editingBook.id);
        if (error) throw error;
        alert("Book updated successfully!");
      } else {
        const { error } = await supabase.from("books").insert([bookData]);
        if (error) throw error;
        alert("Book added successfully!");
      }

      resetForm();
      loadBooks();
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Failed to save book: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      id: book.id,
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      genre: book.genre || "",
      language: book.language || "",
      subjects: Array.isArray(book.subjects)
        ? book.subjects.join(", ")
        : book.subjects || "",
      cover_image: book.cover_image || "",
      pdf_file: book.pdf_file || null,
      cover_file: null,
      downloads: book.downloads || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (bookId) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
      alert("Book deleted successfully!");
      loadBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      author: "",
      description: "",
      genre: "",
      language: "",
      subjects: "",
      cover_image: "",
      pdf_file: null,
      cover_file: null,
      downloads: 0,
    });
    setEditingBook(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray dark:bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-coral mb-4"></div>
          <p className="text-white dark:text-dark-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-gray dark:bg-white">
      <Header />
      <section className="max-w-7xl mx-auto px-8 py-16">

        {/* === Profile & Metrics === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-dark-gray border-2 border-white dark:border-dark-gray p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full border-2 border-dark-gray/20 dark:border-white/20 bg-dark-gray dark:bg-white flex items-center justify-center text-lg font-semibold text-white dark:text-dark-gray">
                  NC
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-dark-gray/60 dark:text-white/60">
                    Admin Workspace
                  </p>
                  <h1 className="text-2xl font-semibold text-dark-gray dark:text-white">
                    Welcome back, Admin
                  </h1>
                </div>
              </div>
              <p className="text-sm text-dark-gray/70 dark:text-white/70 leading-relaxed">
                Monitor catalogue growth, subscription performance, and community sentiment from your command center.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/books"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest border-2 border-dark-gray/20 dark:border-white/20 text-dark-gray dark:text-white hover:bg-dark-gray dark:hover:bg-white hover:text-white dark:hover:text-dark-gray transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                View Library
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-dark-gray dark:bg-white border-2 border-white/10 dark:border-dark-gray/10 px-6 py-5 flex flex-col justify-between shadow-sm">
                <span className="text-xs uppercase tracking-widest text-white/60 dark:text-dark-gray/60">{stat.label}</span>
                <span className="text-2xl font-semibold text-white dark:text-dark-gray">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* === Analytics === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-dark-gray border-2 border-white dark:border-dark-gray p-6">
            <h2 className="text-2xl font-bold text-dark-gray dark:text-white mb-4 uppercase tracking-widest">
              Monthly Revenue & Active Subscriptions
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueData}>
                <XAxis dataKey="month" stroke="#8884d8" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} />
                <Line type="monotone" dataKey="subscriptions" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-dark-gray border-2 border-white dark:border-dark-gray p-6">
            <h2 className="text-2xl font-bold text-dark-gray dark:text-white mb-4 uppercase tracking-widest">
              Trending Genres
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={genreData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={genreColors[index % genreColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* === Trending Books === */}
        <div className="mb-16 bg-white dark:bg-dark-gray border-2 border-white dark:border-dark-gray p-6">
          <h2 className="text-2xl font-bold text-dark-gray dark:text-white mb-6 uppercase tracking-widest">
            Trending Books
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingBooks.map((book, index) => (
              <div key={index} className="p-6 border-2 border-dark-gray/10 dark:border-white/10 bg-dark-gray dark:bg-white hover:scale-[1.02] transition-transform">
                <h3 className="text-xl font-semibold text-white dark:text-dark-gray mb-2">{book.title}</h3>
                <p className="text-white/70 dark:text-dark-gray/70 text-sm uppercase tracking-widest">
                  Downloads: {book.downloads}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* === Catalogue Management === */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl text-white dark:text-dark-gray font-bold uppercase tracking-widest">
              Catalogue Management
            </h2>
            <p className="text-white/60 dark:text-dark-gray/60 text-sm uppercase tracking-widest">
              Add, curate and maintain the reading experience.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-white dark:bg-dark-gray text-dark-gray dark:text-white border-2 border-white dark:border-dark-gray px-6 py-3 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Book'}
          </button>
        </div>

        {/* Add/Edit Book Form */}
        {showForm && (
          <div className="mb-12 border-2 border-white dark:border-dark-gray p-8 bg-white dark:bg-dark-gray">
            <h2 className="text-2xl text-dark-gray dark:text-white font-bold mb-6 uppercase tracking-widest">
              {editingBook ? 'Edit Book' : 'Add New Book'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Book ID *
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingBook}
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Author *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    placeholder="e.g., English, Spanish"
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Subjects (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleInputChange}
                    placeholder="e.g., Fiction, Romance, Classic"
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Downloads
                  </label>
                  <input
                    type="number"
                    name="downloads"
                    value={formData.downloads}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Upload PDF File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="pdf_file"
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-white dark:file:bg-dark-gray file:text-dark-gray dark:file:text-white file:cursor-pointer"
                    />
                  </div>
                  {formData.pdf_file && !(formData.pdf_file instanceof File) && (
                    <p className="mt-2 text-xs text-white/60 dark:text-dark-gray/60">
                      Current: {formData.pdf_file}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white dark:text-dark-gray text-xs uppercase tracking-widest mb-2">
                    Upload Cover Image
                  </label>
                  <input
                    type="file"
                    name="cover_file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-4 py-3 text-sm focus:outline-none focus:border-coral file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-white dark:file:bg-dark-gray file:text-dark-gray dark:file:text-white file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-white dark:bg-dark-gray text-dark-gray dark:text-white border-2 border-white dark:border-dark-gray px-6 py-3 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-gray dark:border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 bg-dark-gray dark:bg-white text-white dark:text-dark-gray border-2 border-white dark:border-dark-gray px-6 py-3 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Books Table */}
        <div className="border-2 border-white dark:border-dark-gray overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white dark:bg-dark-gray">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Cover
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Author
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Genre
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Downloads
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-dark-gray dark:text-white font-bold border-b-2 border-dark-gray dark:border-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-white/60 dark:text-dark-gray/60 text-sm uppercase tracking-widest">
                    No books found. Add your first book!
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="border-b border-white/10 dark:border-dark-gray/10 hover:bg-white/5 dark:hover:bg-dark-gray/5 transition-colors">
                    <td className="px-6 py-4">
                      {book.cover_image ? (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-16 h-24 object-cover border-2 border-white dark:border-dark-gray"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-white dark:bg-dark-gray flex items-center justify-center text-2xl border-2 border-white dark:border-dark-gray">
                          📚
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white dark:text-dark-gray text-sm font-medium uppercase tracking-widest">
                        {book.title}
                      </div>
                      {book.description && (
                        <div className="text-white/60 dark:text-dark-gray/60 text-xs mt-1 line-clamp-2">
                          {book.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white dark:text-dark-gray text-sm uppercase tracking-widest">
                      {book.author || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-white dark:text-dark-gray text-sm uppercase tracking-widest">
                      {book.genre || '-'}
                    </td>
                    <td className="px-6 py-4 text-white dark:text-dark-gray text-sm">
                      {book.downloads || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 bg-white dark:bg-dark-gray text-dark-gray dark:text-white border-2 border-white dark:border-dark-gray hover:opacity-80 transition-opacity"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="p-2 bg-white dark:bg-dark-gray text-dark-gray dark:text-white border-2 border-white dark:border-dark-gray hover:opacity-80 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-white/40 dark:text-dark-gray/40 text-xs uppercase tracking-widest">
          Total Books: {books.length}
        </div>
      </section>
    </div>
  );
};

export default Admin;
