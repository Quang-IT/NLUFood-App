package com.nlufood.repository;

import com.nlufood.model.VipPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VipPackageRepository extends JpaRepository<VipPackage, Long> {
}
