'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import Link from 'next/link';

export default function Navbar() {
  return (
    <BootstrapNavbar bg="light" expand="lg" className="mb-3">
      <Container>
        <BootstrapNavbar.Brand>
          <Link href="/" className="navbar-brand">
            PUM app
          </Link>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Link href="/pages/household" className="nav-link">
              Inventory
            </Link>
            <Link href="/pages/admin" className="nav-link">
              Admin
            </Link>
            <Link href="/pages/feedback" className="nav-link">
              feedback
            </Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
